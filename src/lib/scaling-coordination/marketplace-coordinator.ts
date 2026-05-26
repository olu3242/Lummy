import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ScalingCoordinationRunResult } from "./scaling-events"

const NICHES = ["fashion", "food", "beauty", "electronics", "services", "health"] as const

export async function runMarketplaceCoordinator(): Promise<ScalingCoordinationRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("marketplace")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const thirtyDaysAgo  = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const sixtyDaysAgo   = new Date(Date.now() - 60 * 86_400_000).toISOString()
    const sevenDaysAgo   = new Date(Date.now() - 7 * 86_400_000).toISOString()

    // ── Per-niche revenue and creator counts ─────────────────────────────────
    const { data: profiles } = await supabase
      .from("creator_profiles")
      .select("id, niche")
      .eq("is_published", true)

    const creatorNicheMap = new Map<string, string>()
    const nicheCreatorCount = new Map<string, number>()

    for (const p of (profiles ?? []) as { id: string; niche: string | null }[]) {
      const niche = (p.niche ?? "").toLowerCase()
      if (!niche) continue
      creatorNicheMap.set(p.id, niche)
      nicheCreatorCount.set(niche, (nicheCreatorCount.get(niche) ?? 0) + 1)
    }

    const creatorIds = [...creatorNicheMap.keys()]

    // Revenue last 30d and prior 30d per creator to compute MoM growth
    const { data: recent30dOrders } = await supabase
      .from("orders")
      .select("creator_id, total_amount_kobo")
      .eq("status", "completed")
      .gte("created_at", thirtyDaysAgo)
      .in("creator_id", creatorIds.slice(0, 500))

    const { data: prior30dOrders } = await supabase
      .from("orders")
      .select("creator_id, total_amount_kobo")
      .eq("status", "completed")
      .gte("created_at", sixtyDaysAgo)
      .lt("created_at", thirtyDaysAgo)
      .in("creator_id", creatorIds.slice(0, 500))

    const nicheRecentRevenue = new Map<string, number>()
    const nichePriorRevenue  = new Map<string, number>()

    for (const o of (recent30dOrders ?? []) as { creator_id: string; total_amount_kobo: number }[]) {
      const niche = creatorNicheMap.get(o.creator_id)
      if (!niche) continue
      nicheRecentRevenue.set(niche, (nicheRecentRevenue.get(niche) ?? 0) + (o.total_amount_kobo ?? 0))
    }

    for (const o of (prior30dOrders ?? []) as { creator_id: string; total_amount_kobo: number }[]) {
      const niche = creatorNicheMap.get(o.creator_id)
      if (!niche) continue
      nichePriorRevenue.set(niche, (nichePriorRevenue.get(niche) ?? 0) + (o.total_amount_kobo ?? 0))
    }

    // Emit localized opportunities for qualifying niches (max 5)
    let opportunityCount = 0
    for (const niche of NICHES) {
      if (opportunityCount >= 5) break

      const activeCreators    = nicheCreatorCount.get(niche) ?? 0
      const recentRevenue     = nicheRecentRevenue.get(niche) ?? 0
      const priorRevenue      = nichePriorRevenue.get(niche) ?? 0
      const revenueGrowthRate = priorRevenue > 0
        ? (recentRevenue - priorRevenue) / priorRevenue
        : 0

      if (revenueGrowthRate > 0.20 && activeCreators < 10) {
        const opportunityScore = Math.min(100, Math.round(revenueGrowthRate * 50 + (10 - Math.min(activeCreators, 10)) * 5))

        await emitEvent("localized_monetization_opportunity", {
          tenantId: "platform", creatorId: "platform", correlationId,
        }, {
          region: "Nigeria",
          niche,
          opportunityScore,
          activeCreators,
          revenueGrowthRate,
          underservedSignals: ["low_creator_density", "revenue_growth_detected"],
          snapshotDate: today,
        }, `localized_opportunity:${niche}:${today}`)
        eventsEmitted++
        opportunityCount++
        signals.push(`localized_opportunity:${niche}:growth=${(revenueGrowthRate * 100).toFixed(0)}%:creators=${activeCreators}`)
      }
    }

    // ── Discovery optimization from conversion drop events ───────────────────
    const { data: conversionDropEvents } = await supabase
      .from("automation_events")
      .select("id")
      .eq("event_name", "marketplace_conversion_drop")
      .gte("created_at", sevenDaysAgo)

    const conversionDropCount = (conversionDropEvents ?? []).length

    if (conversionDropCount >= 2) {
      await emitEvent("discovery_optimization_recommended", {
        tenantId: "platform", creatorId: "platform", correlationId,
      }, {
        recommendationType: "fix_conversion_gap",
        affectedCreators: conversionDropCount * 5,
        estimatedReachBoost: 20,
        priorityScore: Math.min(100, conversionDropCount * 10),
        snapshotDate: today,
      }, `discovery_optimization:platform:${today}`)
      eventsEmitted++
      signals.push(`discovery_optimization:conversion_drops=${conversionDropCount}`)
    }

    logger.info("[marketplace-coordinator] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[marketplace-coordinator] engine failed", { error: String(err) })
    return { module: "marketplace-coordinator", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [String(err)] }
  }

  return { module: "marketplace-coordinator", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
