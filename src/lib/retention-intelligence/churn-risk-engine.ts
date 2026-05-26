import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { RetentionIntelligenceRunResult } from "./retention-events"

export async function runChurnRiskEngine(limit = 300): Promise<RetentionIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("churn-risk")
  const signals: string[] = []

  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString()
    const thirtyDaysAgo   = new Date(Date.now() - 30 * 86_400_000).toISOString()

    const { data: publishedCreators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    const allCreatorIds = (publishedCreators ?? []).map((c: { id: string }) => c.id)

    // Creators that have had at least one order ever
    const { data: everOrdered } = await supabase
      .from("orders")
      .select("creator_id")
      .in("creator_id", allCreatorIds)

    const everOrderedSet = new Set(
      (everOrdered ?? []).map((r: { creator_id: string }) => r.creator_id)
    )
    const eligibleIds = allCreatorIds.filter(id => everOrderedSet.has(id))

    // Creators with at least one order in the last 14d
    const { data: orderedIn14d } = await supabase
      .from("orders")
      .select("creator_id")
      .in("creator_id", eligibleIds)
      .gte("created_at", fourteenDaysAgo)

    const activeIn14d = new Set(
      (orderedIn14d ?? []).map((r: { creator_id: string }) => r.creator_id)
    )
    const silentIn14d = eligibleIds.filter(id => !activeIn14d.has(id))

    // Creators with at least one order in the last 30d
    const { data: orderedIn30d } = await supabase
      .from("orders")
      .select("creator_id")
      .in("creator_id", eligibleIds)
      .gte("created_at", thirtyDaysAgo)

    const activeIn30d = new Set(
      (orderedIn30d ?? []).map((r: { creator_id: string }) => r.creator_id)
    )
    const silentIn30d = eligibleIds.filter(id => !activeIn30d.has(id))

    signals.push(`eligible_creators:${eligibleIds.length}`)
    signals.push(`silent_14d:${silentIn14d.length}`)
    signals.push(`silent_30d:${silentIn30d.length}`)

    const churnRate14d = eligibleIds.length > 0
      ? Math.round((silentIn14d.length / eligibleIds.length) * 100)
      : 0
    const churnRate30d = eligibleIds.length > 0
      ? Math.round((silentIn30d.length / eligibleIds.length) * 100)
      : 0

    signals.push(`platform_churn_rate_14d:${churnRate14d}pct`)
    signals.push(`platform_churn_rate_30d:${churnRate30d}pct`)

    if (churnRate14d > 50) signals.push("platform_churn_alert:14d_rate_critical")
    if (churnRate30d > 70) signals.push("platform_churn_alert:30d_rate_critical")

    logger.info("[churn-risk] engine complete", {
      eligibleCreators: eligibleIds.length,
      silentIn14d: silentIn14d.length,
      silentIn30d: silentIn30d.length,
      churnRate14d,
      churnRate30d,
      correlationId,
    })
  } catch (err) {
    logger.error("[churn-risk] engine failed", { error: String(err) })
  }

  return {
    module: "churn-risk",
    eventsEmitted: 0,
    alertsRaised: 0,
    durationMs: Date.now() - start,
    signals,
  }
}
