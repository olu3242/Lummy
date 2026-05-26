/**
 * Marketplace Integrity Engine — platform-wide integrity monitoring. Combines
 * trust, dispute, fraud, and abuse signals into a single integrity score.
 *
 * Reads from: creator_trust_scores, orders, automation_events
 * Writes to:  marketplace_integrity_snapshots
 * Emits:      marketplace_integrity_risk, marketplace_trust_degradation
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { TrustIntelligenceRunResult } from "./trust-events"

export interface IntegrityReport {
  overallIntegrityScore: number  // 0-100
  trustScore: number             // from creator_trust_scores average
  disputeScore: number           // inverted dispute rate
  fraudScore: number             // inverted fraud signal density
  highRiskCreators: number
  signals: string[]
}

export async function computeMarketplaceIntegrity(): Promise<IntegrityReport> {
  const supabase = createAdminClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const signals: string[] = []

  const [trustRes, refundRes, fraudEventsRes] = await Promise.allSettled([
    supabase.from("creator_trust_scores")
      .select("trust_score, tier")
      .limit(500),
    supabase.from("orders")
      .select("creator_id, status")
      .eq("status", "refunded")
      .gte("created_at", sevenDaysAgo)
      .limit(200),
    supabase.from("automation_events")
      .select("id, creator_id")
      .eq("event_name", "customer_fraud_risk")
      .gte("created_at", sevenDaysAgo)
      .limit(100),
  ])

  const trustRows = trustRes.status === "fulfilled"
    ? (trustRes.value.data ?? []) as { trust_score: number; tier: string }[]
    : []
  const refunds     = (refundRes.status === "fulfilled" ? refundRes.value.data ?? [] : []) as { creator_id: string }[]
  const fraudEvents = (fraudEventsRes.status === "fulfilled" ? fraudEventsRes.value.data ?? [] : []) as { id: string }[]

  // Average trust score across all creators
  const avgTrust = trustRows.length > 0
    ? trustRows.reduce((s, r) => s + r.trust_score, 0) / trustRows.length
    : 70

  const atRiskCreators = trustRows.filter(r => r.tier === "at_risk").length
  const highRiskCreators = atRiskCreators

  // Dispute score: based on refund volume
  const refundCount  = refunds.length
  const disputeScore = Math.max(0, 100 - refundCount * 2)

  // Fraud signal density
  const fraudDensity = trustRows.length > 0 ? fraudEvents.length / trustRows.length : 0
  const fraudScore   = Math.max(0, 100 - fraudDensity * 500)

  // Overall integrity: weighted combination
  const overallIntegrityScore = Math.round(avgTrust * 0.5 + disputeScore * 0.3 + fraudScore * 0.2)

  if (atRiskCreators > 5)       signals.push(`${atRiskCreators}_at_risk_creators`)
  if (refundCount > 10)         signals.push("elevated_refunds")
  if (fraudEvents.length > 5)   signals.push("fraud_signals_detected")
  if (overallIntegrityScore >= 80) signals.push("healthy_marketplace_integrity")
  if (overallIntegrityScore < 50)  signals.push("integrity_at_risk")

  return { overallIntegrityScore, trustScore: avgTrust, disputeScore, fraudScore, highRiskCreators, signals }
}

export async function runMarketplaceIntegrityEngine(): Promise<TrustIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("integrity")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const report = await computeMarketplaceIntegrity()
    signals.push(...report.signals)

    // Persist integrity snapshot
    await supabase.from("marketplace_integrity_snapshots").upsert({
      snapshot_date:          today,
      overall_integrity_score: report.overallIntegrityScore,
      trust_score:            report.trustScore,
      dispute_score:          report.disputeScore,
      fraud_score:            report.fraudScore,
      high_risk_creators:     report.highRiskCreators,
      signals:                report.signals,
    }, { onConflict: "snapshot_date" })

    // Fetch prior snapshot for degradation detection
    const { data: prior } = await supabase
      .from("marketplace_integrity_snapshots")
      .select("overall_integrity_score")
      .lt("snapshot_date", today)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle()

    const priorScore = (prior as { overall_integrity_score: number } | null)?.overall_integrity_score

    // Emit integrity_risk if score < 60
    if (report.overallIntegrityScore < 60) {
      await emitEvent("marketplace_integrity_risk", {
        tenantId: "platform", correlationId,
      }, {
        overallIntegrityScore: report.overallIntegrityScore,
        highRiskCreators:      report.highRiskCreators,
        disputeRate:           (100 - report.disputeScore) / 100,
        fraudSignals:          report.signals.filter(s => s.includes("fraud")),
        snapshotDate:          today,
      }, `integrity_risk:${today}`)
      eventsEmitted++
    }

    // Emit trust_degradation if ≥10pt drop from prior day
    if (priorScore != null && report.overallIntegrityScore <= priorScore - 10) {
      await emitEvent("marketplace_trust_degradation", {
        tenantId: "platform", correlationId,
      }, {
        previousScore: priorScore,
        currentScore:  report.overallIntegrityScore,
        degradation:   priorScore - report.overallIntegrityScore,
        primaryReason: report.signals[0] ?? "composite_degradation",
        snapshotDate:  today,
      }, `trust_degradation:${today}`)
      eventsEmitted++
    }

    logger.info("[marketplace-integrity] engine complete", {
      integrityScore: report.overallIntegrityScore, eventsEmitted, correlationId,
    })
  } catch (err) {
    logger.error("[marketplace-integrity] engine failed", { error: String(err) })
  }

  return { module: "marketplace-integrity", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
