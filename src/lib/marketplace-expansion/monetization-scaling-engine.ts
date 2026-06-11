/**
 * Monetization Scaling Engine — identifies ecosystem-wide monetization gaps
 * and opportunities for platform revenue acceleration.
 *
 * Reads from: creator_performance_snapshots, creator_profiles, orders
 * Emits:      ecosystem_monetization_opportunity, ecosystem_expansion_opportunity
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ExpansionIntelligenceRunResult } from "./expansion-events"

export async function runMonetizationScalingEngine(): Promise<ExpansionIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("monscale")
  const today = new Date().toISOString().split("T")[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    // Creators who are published but have 0 sales in 30d = monetization gap
    const [snapshotsRes, publishedRes] = await Promise.allSettled([
      supabase.from("creator_performance_snapshots")
        .select("creator_id, order_count, revenue_kobo")
        .gte("snapshot_date", thirtyDaysAgo),
      supabase.from("creator_profiles")
        .select("id")
        .eq("is_published", true)
        .limit(500),
    ])

    const snapshotCreators = new Set(
      ((snapshotsRes.status === "fulfilled" ? snapshotsRes.value.data ?? [] : []) as { creator_id: string; order_count: number }[])
        .filter(s => s.order_count >= 1)
        .map(s => s.creator_id)
    )
    const publishedCreators = snapshotsRes.status === "fulfilled"
      ? (snapshotsRes.value.data ?? []) as { creator_id: string; order_count: number; revenue_kobo: number }[]
      : []
    const allPublished = publishedRes.status === "fulfilled"
      ? (publishedRes.value.data ?? []).map((c: { id: string }) => c.id)
      : []

    const zeroSalesCount = allPublished.filter(id => !snapshotCreators.has(id)).length

    // Identify monetization gap opportunity
    if (zeroSalesCount >= 5) {
      const estimatedRevenue = zeroSalesCount * 5_000 * 100  // ₦5000 avg × kobo
      await emitEvent("ecosystem_expansion_opportunity", {
        tenantId: "platform", correlationId,
      }, {
        opportunityType:           "monetization_gap",
        title:                     `${zeroSalesCount} published stores with zero sales in 30 days`,
        estimatedRevenueImpactKobo: estimatedRevenue,
        confidence:                zeroSalesCount >= 20 ? "high" : "medium",
        actionableCreators:        allPublished.filter(id => !snapshotCreators.has(id)).slice(0, 10),
        snapshotDate:              today,
      }, `monetization_gap:${today}`)
      eventsEmitted++
      signals.push(`monetization_gap:${zeroSalesCount}stores`)
    }

    // Platform revenue acceleration opportunity
    const totalRevenue30d = publishedCreators.reduce((s, r) => s + r.revenue_kobo, 0)
    const avgRevenuePerCreator = snapshotCreators.size > 0 ? totalRevenue30d / snapshotCreators.size : 0

    if (avgRevenuePerCreator > 0) {
      const liftOpportunity = Math.round(zeroSalesCount * avgRevenuePerCreator * 0.3)

      await emitEvent("ecosystem_monetization_opportunity", {
        tenantId: "platform", correlationId,
      }, {
        opportunityType:        "cross_sell",
        affectedCreators:       zeroSalesCount,
        estimatedRevenueKobo:   liftOpportunity,
        confidence:             "medium",
        snapshotDate:           today,
      }, `eco_mon_opp:${today}`)
      eventsEmitted++
    }

    logger.info("[monetization-scaling] engine complete", {
      zeroSalesCount, totalRevenue30d, eventsEmitted, correlationId,
    })
  } catch (err) {
    logger.error("[monetization-scaling] engine failed", { error: String(err) })
  }

  return { module: "monetization-scaling", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals }
}
