/**
 * Creator Risk Engine — churn risk, checkout loss risk, response delay,
 * onboarding abandonment, payment failure spikes.
 *
 * Wraps churn.ts and adds checkout/payment risk overlays.
 */

import { computeChurnRisk, upsertChurnScore } from "@/lib/creator/churn"
import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"

export interface CreatorRiskProfile {
  creatorId: string
  churnRiskScore: number
  churnRiskTier: "low" | "medium" | "high" | "critical"
  checkoutLossRisk: "low" | "medium" | "high"
  paymentFailureRate: number
  hasResponseDelay: boolean
  riskSignals: string[]
  urgentAction: string | null
}

// ── Checkout Loss Risk ────────────────────────────────────────────────────────

async function assessCheckoutLossRisk(creatorId: string): Promise<{
  level: "low" | "medium" | "high"; abandonRate: number
}> {
  const supabase = createAdminClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [startedRes, abandonedRes] = await Promise.allSettled([
    supabase.from("automation_events")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .eq("event_name", "checkout_started")
      .gte("created_at", sevenDaysAgo),
    supabase.from("automation_events")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .eq("event_name", "checkout_abandoned")
      .gte("created_at", sevenDaysAgo),
  ])

  const started  = startedRes.status  === "fulfilled" ? (startedRes.value.count  ?? 0) : 0
  const abandoned = abandonedRes.status === "fulfilled" ? (abandonedRes.value.count ?? 0) : 0

  if (started < 3) return { level: "low", abandonRate: 0 }
  const abandonRate = abandoned / started

  return {
    level: abandonRate >= 0.5 ? "high" : abandonRate >= 0.3 ? "medium" : "low",
    abandonRate,
  }
}

// ── Payment Failure Rate ──────────────────────────────────────────────────────

async function getPaymentFailureRate(creatorId: string): Promise<number> {
  const supabase = createAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [completedRes, failedRes] = await Promise.allSettled([
    supabase.from("orders").select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId).eq("status", "completed").gte("created_at", thirtyDaysAgo),
    supabase.from("orders").select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId).eq("status", "failed").gte("created_at", thirtyDaysAgo),
  ])

  const completed = completedRes.status === "fulfilled" ? (completedRes.value.count ?? 0) : 0
  const failed    = failedRes.status    === "fulfilled" ? (failedRes.value.count    ?? 0) : 0
  const total = completed + failed

  return total > 0 ? failed / total : 0
}

// ── Full Risk Profile ─────────────────────────────────────────────────────────

export async function computeCreatorRiskProfile(creatorId: string): Promise<CreatorRiskProfile> {
  const correlationId = generateCorrelationId("cre")
  const today = new Date().toISOString().split("T")[0]

  const [churnRisk, checkoutRisk, paymentFailureRate] = await Promise.allSettled([
    computeChurnRisk(creatorId),
    assessCheckoutLossRisk(creatorId),
    getPaymentFailureRate(creatorId),
  ])

  const churn = churnRisk.status === "fulfilled" ? churnRisk.value : null
  const checkout = checkoutRisk.status === "fulfilled" ? checkoutRisk.value : { level: "low" as const, abandonRate: 0 }
  const failRate = paymentFailureRate.status === "fulfilled" ? paymentFailureRate.value : 0

  if (churn) await upsertChurnScore(churn).catch(() => {})

  const riskSignals: string[] = [
    ...(churn?.signals ?? []),
    ...(checkout.level !== "low" ? [`checkout_abandon_${checkout.level}`] : []),
    ...(failRate > 0.2 ? [`payment_failure_rate_${(failRate * 100).toFixed(0)}pct`] : []),
  ]

  // Emit churn_risk event if high/critical
  if (churn?.riskTier === "high" || churn?.riskTier === "critical") {
    void emitEvent("creator_churn_risk", { tenantId: creatorId, creatorId, correlationId }, {
      riskScore: churn.riskScore,
      riskTier:  churn.riskTier,
      signals:   churn.signals,
      recommendedAction: churn.recommendedAction,
    }, `creator_churn_risk:${creatorId}:${today}`).catch(() => {})
  }

  const urgentAction =
    churn?.riskTier === "critical"   ? churn.recommendedAction :
    checkout.level === "high"        ? "Review checkout flow — high abandonment rate" :
    failRate > 0.3                   ? "Investigate payment failures — high failure rate" :
    null

  return {
    creatorId,
    churnRiskScore:     churn?.riskScore ?? 0,
    churnRiskTier:      churn?.riskTier  ?? "low",
    checkoutLossRisk:   checkout.level,
    paymentFailureRate: failRate,
    hasResponseDelay:   false,  // future: track WA response times
    riskSignals,
    urgentAction,
  }
}

// ── Batch risk scanning ───────────────────────────────────────────────────────

export async function scanAtRiskCreators(limit = 100): Promise<{
  scanned: number; critical: number; high: number
}> {
  const supabase = createAdminClient()
  const { data: creators } = await supabase
    .from("creator_churn_scores")
    .select("creator_id, risk_tier")
    .in("risk_tier", ["high", "critical"])
    .order("risk_score", { ascending: false })
    .limit(limit)

  let scanned = 0, critical = 0, high = 0
  for (const c of (creators ?? []) as { creator_id: string; risk_tier: string }[]) {
    try {
      const profile = await computeCreatorRiskProfile(c.creator_id)
      scanned++
      if (profile.churnRiskTier === "critical") critical++
      else if (profile.churnRiskTier === "high") high++
    } catch (err) {
      logger.warn("[creator-risk-engine] scan failed", { creatorId: c.creator_id, error: String(err) })
    }
  }

  return { scanned, critical, high }
}
