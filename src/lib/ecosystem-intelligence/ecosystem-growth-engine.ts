/**
 * Ecosystem Growth Engine — tracks platform-wide GMV trends and emits
 * ecosystem_revenue_growth when platform growth is positive.
 *
 * Reads from: creator_performance_snapshots, creator_profiles
 * Emits: ecosystem_revenue_growth
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { EcosystemIntelligenceRunResult } from "./ecosystem-events"

export async function runEcosystemGrowthEngine(): Promise<EcosystemIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("eco")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const thirtyDaysAgo    = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]
    const sixtyDaysAgo     = new Date(Date.now() - 60 * 86_400_000).toISOString().split("T")[0]

    const [current30, prior30, newCreators] = await Promise.all([
      supabase.from("creator_performance_snapshots")
        .select("creator_id, revenue_kobo, order_count")
        .gte("snapshot_date", thirtyDaysAgo),
      supabase.from("creator_performance_snapshots")
        .select("revenue_kobo")
        .gte("snapshot_date", sixtyDaysAgo)
        .lt("snapshot_date", thirtyDaysAgo),
      supabase.from("creator_profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo),
    ])

    const currentRows = (current30.data ?? []) as { creator_id: string; revenue_kobo: number; order_count: number }[]
    const priorRows   = (prior30.data ?? []) as { revenue_kobo: number }[]

    const totalRevenue30d    = currentRows.reduce((s, r) => s + r.revenue_kobo, 0)
    const totalRevenuePrior  = priorRows.reduce((s, r) => s + r.revenue_kobo, 0)
    const growthRate         = totalRevenuePrior > 0
      ? (totalRevenue30d - totalRevenuePrior) / totalRevenuePrior
      : totalRevenue30d > 0 ? 1 : 0

    const activeCreatorIds = new Set(currentRows.filter(r => r.order_count >= 1).map(r => r.creator_id))
    const activeCreators   = activeCreatorIds.size
    const newCreatorCount  = newCreators.count ?? 0

    // Top growth creators (most revenue in last 30d)
    const creatorRevMap = new Map<string, number>()
    for (const r of currentRows) {
      creatorRevMap.set(r.creator_id, (creatorRevMap.get(r.creator_id) ?? 0) + r.revenue_kobo)
    }
    const topGrowthCreators = [...creatorRevMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    if (growthRate > 0 || totalRevenue30d > 0) {
      await emitEvent("ecosystem_revenue_growth", {
        tenantId: "platform",
        correlationId,
      }, {
        totalRevenue30dKobo:      totalRevenue30d,
        totalRevenuePrior30dKobo: totalRevenuePrior,
        growthRate,
        activeCreators,
        newCreators:              newCreatorCount,
        topGrowthCreators,
        snapshotDate:             today,
      }, `ecosystem_revenue_growth:${today}`)

      eventsEmitted++
      signals.push(`gmv:${Math.round(totalRevenue30d / 100000)}k_ngn:growth${(growthRate * 100).toFixed(0)}%`)
    }

    if (growthRate < -0.1) signals.push("ecosystem_revenue_declining")
    if (growthRate > 0.2)  signals.push("ecosystem_strong_growth")

    logger.info("[ecosystem-growth] engine complete", {
      totalRevenue30d, growthRate: `${(growthRate * 100).toFixed(1)}%`, activeCreators, correlationId,
    })
  } catch (err) {
    logger.error("[ecosystem-growth] engine failed", { error: String(err) })
  }

  return { module: "ecosystem-growth", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals }
}
