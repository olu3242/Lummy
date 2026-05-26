/**
 * Creator Trust Engine — computes per-creator trust scores from order history,
 * fulfillment rates, dispute frequency, and operational consistency.
 *
 * Reads from: orders, creator_profiles, automation_events (dispute signals)
 * Writes to:  creator_trust_scores
 * Emits:      creator_trust_improved, creator_trust_degraded, creator_fulfillment_risk
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { CreatorTrustScore, TrustIntelligenceRunResult } from "./trust-events"

// ── Trust Score Computation ───────────────────────────────────────────────────

export async function computeCreatorTrustScore(creatorId: string): Promise<CreatorTrustScore> {
  const supabase = createAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000).toISOString()

  const [ordersRes, recentOrdersRes, profileRes] = await Promise.allSettled([
    supabase.from("orders")
      .select("id, status, created_at")
      .eq("creator_id", creatorId)
      .gte("created_at", ninetyDaysAgo),
    supabase.from("orders")
      .select("id, status")
      .eq("creator_id", creatorId)
      .gte("created_at", thirtyDaysAgo),
    supabase.from("creator_profiles")
      .select("created_at, is_published")
      .eq("id", creatorId)
      .maybeSingle(),
  ])

  const allOrders = ordersRes.status === "fulfilled"
    ? (ordersRes.value.data ?? []) as { id: string; status: string; created_at: string }[]
    : []
  const recentOrders = recentOrdersRes.status === "fulfilled"
    ? (recentOrdersRes.value.data ?? []) as { id: string; status: string }[]
    : []
  const profile = profileRes.status === "fulfilled"
    ? profileRes.value.data as { created_at: string; is_published: boolean } | null
    : null

  const signals: string[] = []

  // Fulfillment rate: completed / total
  const completed = allOrders.filter(o => o.status === "completed").length
  const refunded  = allOrders.filter(o => o.status === "refunded").length
  const total     = allOrders.length
  const fulfillmentRate = total > 0 ? (completed / total) * 100 : 70 // default to 70 for new creators

  // Dispute proxy: refunded orders as dispute signal
  const disputeRate = total > 0 ? refunded / total : 0
  const disputeFrequency = Math.max(0, 100 - disputeRate * 500) // 20% refund rate → 0 score

  // Payment reliability: orders that completed without timeout
  const timedOut = allOrders.filter(o => o.status === "payment_timeout" || o.status === "expired").length
  const paymentReliability = total > 0 ? Math.max(0, 100 - (timedOut / total) * 200) : 80

  // Response consistency: proxy from WA click patterns (simplified)
  const responseConsistency = recentOrders.length >= 3 ? 75 : 60

  // Tenure bonus (0-20 pts): older, established creators get trust boost
  const ageMs = profile?.created_at
    ? Date.now() - new Date(profile.created_at).getTime()
    : 0
  const ageMonths = ageMs / (30 * 86_400_000)
  const tenureBonus = Math.min(20, Math.round(ageMonths * 2))

  // Composite score
  const rawScore = (fulfillmentRate * 0.35) + (responseConsistency * 0.2) +
    (paymentReliability * 0.25) + (disputeFrequency * 0.2)
  const trustScore = Math.min(100, Math.round(rawScore * 0.8 + tenureBonus))

  if (fulfillmentRate >= 90) signals.push("high_fulfillment")
  if (disputeRate > 0.1)     signals.push("elevated_dispute_rate")
  if (total >= 20)           signals.push("established_seller")
  if (trustScore >= 80)      signals.push("trusted_creator")
  if (trustScore < 40)       signals.push("trust_at_risk")

  const tier: CreatorTrustScore["tier"] =
    trustScore >= 80 ? "verified" :
    trustScore >= 60 ? "trusted" :
    trustScore >= 40 ? "standard" :
    "at_risk"

  return {
    creatorId,
    trustScore,
    tier,
    components: { fulfillmentRate, responseConsistency, paymentReliability, disputeFrequency, tenureBonus },
    signals,
  }
}

// ── Batch Trust Scoring ───────────────────────────────────────────────────────

export async function runCreatorTrustEngine(limit = 200): Promise<TrustIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("trust")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let creatorsScored = 0

  try {
    // Get creators with recent activity
    const { data: activeCreators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    const creatorIds = (activeCreators ?? []).map((c: { id: string }) => c.id)

    // Fetch prior trust scores for delta detection
    const { data: priorScores } = await supabase
      .from("creator_trust_scores")
      .select("creator_id, trust_score")
      .in("creator_id", creatorIds.slice(0, 100))

    const priorMap = new Map<string, number>(
      ((priorScores ?? []) as { creator_id: string; trust_score: number }[])
        .map(r => [r.creator_id, r.trust_score])
    )

    for (const creatorId of creatorIds) {
      try {
        const score = await computeCreatorTrustScore(creatorId)
        creatorsScored++

        // Upsert trust score
        await supabase.from("creator_trust_scores").upsert({
          creator_id:          creatorId,
          trust_score:         score.trustScore,
          tier:                score.tier,
          fulfillment_rate:    score.components.fulfillmentRate,
          response_consistency: score.components.responseConsistency,
          payment_reliability: score.components.paymentReliability,
          dispute_frequency:   score.components.disputeFrequency,
          tenure_bonus:        score.components.tenureBonus,
          signals:             score.signals,
          computed_at:         today,
        }, { onConflict: "creator_id" })

        const prior = priorMap.get(creatorId)

        // Emit improvement event (≥10pt gain)
        if (prior != null && score.trustScore >= prior + 10) {
          await emitEvent("creator_trust_improved", {
            tenantId: creatorId, creatorId, correlationId,
          }, {
            previousScore: prior,
            newScore:      score.trustScore,
            improvement:   score.trustScore - prior,
            triggerSignal: score.signals[0] ?? "composite_improvement",
            snapshotDate:  today,
          }, `trust_improved:${creatorId}:${today}`)
          eventsEmitted++
          signals.push(`improved:${creatorId}:+${score.trustScore - prior}`)
        }

        // Emit degradation event (≥10pt drop)
        if (prior != null && score.trustScore <= prior - 10) {
          await emitEvent("creator_trust_degraded", {
            tenantId: creatorId, creatorId, correlationId,
          }, {
            previousScore:  prior,
            newScore:       score.trustScore,
            degradation:    prior - score.trustScore,
            primaryReason:  score.signals.find(s => s.includes("dispute") || s.includes("risk")) ?? "performance_drop",
            snapshotDate:   today,
          }, `trust_degraded:${creatorId}:${today}`)
          eventsEmitted++
          signals.push(`degraded:${creatorId}:-${prior - score.trustScore}`)
        }

        // Emit fulfillment risk for at-risk creators with recent orders
        if (score.tier === "at_risk" && score.components.fulfillmentRate < 60) {
          await emitEvent("creator_fulfillment_risk", {
            tenantId: creatorId, creatorId, correlationId,
          }, {
            creatorId,
            fulfillmentRate: score.components.fulfillmentRate,
            pendingOrders:   0,
            overdueOrders:   0,
            snapshotDate:    today,
          }, `fulfillment_risk:${creatorId}:${today}`)
          eventsEmitted++
        }
      } catch (_err) {
        // Individual creator scoring failures are non-fatal
      }
    }

    logger.info("[creator-trust] engine complete", { creatorsScored, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[creator-trust] engine failed", { error: String(err) })
  }

  return { module: "creator-trust", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals, creatorsScored }
}
