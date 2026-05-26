/**
 * Reputation Engine — computes per-creator reputation from trust score history,
 * customer satisfaction signals, and operational consistency over time.
 *
 * Reads from: creator_trust_scores, creator_metrics_daily, creator_health_scores
 * Emits:      creator_reputation_drop, creator_high_reliability
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { TrustIntelligenceRunResult } from "./trust-events"

export interface ReputationScore {
  creatorId: string
  reputationScore: number     // 0-100
  trend: "improving" | "stable" | "declining"
  consistencyScore: number    // 0-100 — variance in trust score over time
  signals: string[]
}

export async function computeCreatorReputation(creatorId: string): Promise<ReputationScore> {
  const supabase = createAdminClient()

  const [trustHistoryRes, healthRes, metricsRes] = await Promise.allSettled([
    supabase.from("creator_trust_scores")
      .select("trust_score, computed_at")
      .eq("creator_id", creatorId)
      .order("computed_at", { ascending: false })
      .limit(1),
    supabase.from("creator_health_scores")
      .select("overall_score")
      .eq("creator_id", creatorId)
      .maybeSingle(),
    supabase.from("creator_metrics_daily")
      .select("orders_created, whatsapp_clicks, storefront_views")
      .eq("creator_id", creatorId)
      .gte("date", new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0])
      .limit(30),
  ])

  const trustRows = trustHistoryRes.status === "fulfilled"
    ? (trustHistoryRes.value.data ?? []) as { trust_score: number; computed_at: string }[]
    : []
  const latestTrust = trustRows[0]?.trust_score ?? 60
  const healthScore = healthRes.status === "fulfilled"
    ? ((healthRes.value.data as { overall_score: number } | null)?.overall_score ?? 60)
    : 60
  const metrics = metricsRes.status === "fulfilled"
    ? (metricsRes.value.data ?? []) as { orders_created: number; whatsapp_clicks: number; storefront_views: number }[]
    : []

  const signals: string[] = []

  // Consistency: look at engagement stability (coefficient of variation of views)
  const viewValues = metrics.map(m => m.storefront_views).filter(v => v > 0)
  let consistencyScore = 70
  if (viewValues.length >= 7) {
    const mean = viewValues.reduce((s, v) => s + v, 0) / viewValues.length
    const variance = viewValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / viewValues.length
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 1
    consistencyScore = Math.round(Math.max(0, 100 - cv * 100))
  }

  // Reputation = weighted trust + health + consistency
  const reputationScore = Math.round(latestTrust * 0.5 + healthScore * 0.3 + consistencyScore * 0.2)

  const trend: ReputationScore["trend"] =
    trustRows.length >= 2 && trustRows[0].trust_score > trustRows[1]?.trust_score + 5 ? "improving" :
    trustRows.length >= 2 && trustRows[0].trust_score < trustRows[1]?.trust_score - 5 ? "declining" :
    "stable"

  if (reputationScore >= 80) signals.push("high_reputation")
  if (reputationScore < 40)  signals.push("reputation_risk")
  if (trend === "declining")  signals.push("reputation_declining")
  if (consistencyScore >= 80) signals.push("consistent_performer")

  return { creatorId, reputationScore, trend, consistencyScore, signals }
}

export async function runReputationEngine(limit = 200): Promise<TrustIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("rep")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let creatorsScored = 0

  try {
    const { data: creators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    for (const c of (creators ?? []) as { id: string }[]) {
      try {
        const rep = await computeCreatorReputation(c.id)
        creatorsScored++

        // Emit high_reliability for verified top performers
        if (rep.reputationScore >= 85 && rep.trend !== "declining") {
          await emitEvent("creator_high_reliability", {
            tenantId: c.id, creatorId: c.id, correlationId,
          }, {
            reputationScore:   rep.reputationScore,
            consistencyScore:  rep.consistencyScore,
            trend:             rep.trend,
            snapshotDate:      today,
          }, `high_reliability:${c.id}:${today}`)
          eventsEmitted++
          signals.push(`high_rel:${c.id}:${rep.reputationScore}`)
        }

        // Emit reputation_drop for declining creators
        if (rep.trend === "declining" && rep.reputationScore < 50) {
          await emitEvent("creator_reputation_drop", {
            tenantId: c.id, creatorId: c.id, correlationId,
          }, {
            reputationScore:  rep.reputationScore,
            trend:            rep.trend,
            primaryReason:    rep.signals.find(s => s.includes("risk") || s.includes("declining")) ?? "performance_decline",
            snapshotDate:     today,
          }, `rep_drop:${c.id}:${today}`)
          eventsEmitted++
          signals.push(`rep_drop:${c.id}`)
        }
      } catch (_err) {
        // Individual scoring failures non-fatal
      }
    }

    logger.info("[reputation] engine complete", { creatorsScored, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[reputation] engine failed", { error: String(err) })
  }

  return { module: "reputation", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals, creatorsScored }
}
