/**
 * Creator Ranking Engine — computes composite scores across all active creators
 * and persists ranked snapshots to creator_rankings.
 *
 * Composite score (0-100):
 *   Revenue:    40pts  (orders + GMV in 30d)
 *   Engagement: 30pts  (views + WA clicks in 30d)
 *   Health:     30pts  (health_score from creator_health_scores)
 *
 * Reads from: creator_performance_snapshots, creator_health_scores
 * Writes to:  creator_rankings
 * Emits:      storefront_performance_risk (for bottom-tier struggling creators)
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { MarketplaceIntelligenceRunResult } from "./marketplace-events"

interface CreatorRankRow {
  creatorId: string
  compositeScore: number
  revenueScore: number
  engagementScore: number
  healthScore: number
  orderCount: number
  revenueKobo: number
  views: number
  waClicks: number
}

export async function computeCreatorRankings(limit = 500): Promise<MarketplaceIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("rank")
  const today = new Date().toISOString().split("T")[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    // Aggregate 30-day performance snapshots per creator
    const { data: snapshots } = await supabase
      .from("creator_performance_snapshots")
      .select("creator_id, order_count, revenue_kobo, views, whatsapp_clicks, health_score")
      .gte("snapshot_date", thirtyDaysAgo)
      .limit(limit * 30)

    const creatorMap = new Map<string, { orders: number; revenue: number; views: number; wa: number; healthScores: number[] }>()

    for (const s of (snapshots ?? []) as { creator_id: string; order_count: number; revenue_kobo: number; views: number; whatsapp_clicks: number; health_score: number | null }[]) {
      const c = creatorMap.get(s.creator_id) ?? { orders: 0, revenue: 0, views: 0, wa: 0, healthScores: [] }
      c.orders  += s.order_count
      c.revenue += s.revenue_kobo
      c.views   += s.views
      c.wa      += s.whatsapp_clicks
      if (s.health_score != null) c.healthScores.push(s.health_score)
      creatorMap.set(s.creator_id, c)
    }

    if (creatorMap.size === 0) {
      return { module: "creator-ranking", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals, creatorsScored: 0 }
    }

    // Find percentile thresholds for normalization
    const allRevenues  = [...creatorMap.values()].map(c => c.revenue).sort((a, b) => a - b)
    const allViews     = [...creatorMap.values()].map(c => c.views).sort((a, b) => a - b)
    const allOrders    = [...creatorMap.values()].map(c => c.orders).sort((a, b) => a - b)
    const p90Revenue   = allRevenues[Math.floor(allRevenues.length * 0.9)] || 1
    const p90Views     = allViews[Math.floor(allViews.length * 0.9)] || 1
    const p90Orders    = allOrders[Math.floor(allOrders.length * 0.9)] || 1

    const ranked: CreatorRankRow[] = []

    for (const [creatorId, c] of creatorMap.entries()) {
      const avgHealth = c.healthScores.length > 0
        ? c.healthScores.reduce((s, v) => s + v, 0) / c.healthScores.length
        : 50

      // Revenue component (40pts): normalize against p90
      const revenueScore = Math.min(40, Math.round(
        ((c.orders / p90Orders) * 20) + ((c.revenue / p90Revenue) * 20)
      ))

      // Engagement component (30pts): views + WA clicks normalized
      const waRate = c.views > 0 ? c.wa / c.views : 0
      const engagementScore = Math.min(30, Math.round(
        ((c.views / p90Views) * 20) + (Math.min(waRate * 10, 1) * 10)
      ))

      // Health component (30pts)
      const healthScore = Math.round(avgHealth * 0.3)

      const compositeScore = Math.min(100, revenueScore + engagementScore + healthScore)

      ranked.push({
        creatorId,
        compositeScore,
        revenueScore,
        engagementScore,
        healthScore,
        orderCount:  c.orders,
        revenueKobo: c.revenue,
        views:       c.views,
        waClicks:    c.wa,
      })
    }

    // Sort descending by composite score → assign rank
    ranked.sort((a, b) => b.compositeScore - a.compositeScore)
    const total = ranked.length

    // Persist rankings + detect storefront_performance_risk
    const riskCreators: string[] = []

    for (let i = 0; i < ranked.length; i++) {
      const r = ranked[i]
      const rank       = i + 1
      const percentile = Math.round((1 - rank / total) * 100)
      const tier: "standard" | "growing" | "influential" | "top" =
        percentile >= 90 ? "top" :
        percentile >= 70 ? "influential" :
        percentile >= 40 ? "growing" :
        "standard"

      // Upsert into creator_rankings table
      await supabase.from("creator_rankings").upsert({
        creator_id:      r.creatorId,
        snapshot_date:   today,
        rank,
        percentile,
        tier,
        composite_score: r.compositeScore,
        revenue_score:   r.revenueScore,
        engagement_score: r.engagementScore,
        health_score:    r.healthScore,
      }, { onConflict: "creator_id,snapshot_date" })

      // Emit storefront_performance_risk for bottom 10% with meaningful traffic but poor conversion
      if (percentile < 10 && r.views >= 50) {
        const convRate = r.views > 0 ? r.waClicks / r.views : 0
        const riskType: "low_conversion" | "no_products" | "inactive" | "high_bounce" =
          convRate < 0.02 ? "low_conversion" :
          r.orderCount === 0 ? "inactive" :
          "low_conversion"

        await emitEvent("storefront_performance_risk", {
          tenantId:  r.creatorId,
          creatorId: r.creatorId,
          correlationId,
        }, {
          creatorId:    r.creatorId,
          riskType,
          riskScore:    Math.round((1 - percentile / 100) * 100),
          metric:       `${(convRate * 100).toFixed(1)}% WhatsApp conversion (platform avg: ~8%)`,
          snapshotDate: today,
        }, `storefront_risk:${r.creatorId}:${today}`)

        riskCreators.push(r.creatorId)
        eventsEmitted++
        signals.push(`risk:${r.creatorId}:p${percentile}`)
      }
    }

    logger.info("[creator-ranking] rankings computed", {
      total,
      riskEmitted: riskCreators.length,
      correlationId,
    })

    return {
      module: "creator-ranking",
      eventsEmitted,
      alertsRaised: riskCreators.length,
      durationMs: Date.now() - start,
      signals,
      creatorsScored: total,
    }
  } catch (err) {
    logger.error("[creator-ranking] engine failed", { error: String(err) })
    return { module: "creator-ranking", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [], creatorsScored: 0 }
  }
}
