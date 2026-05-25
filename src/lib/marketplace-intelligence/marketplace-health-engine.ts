/**
 * Marketplace Health Engine — computes a platform-wide health score from
 * creator performance snapshots, emits marketplace_health_updated and
 * marketplace_conversion_drop events.
 *
 * Reads from: creator_performance_snapshots, creator_metrics_daily
 * Emits: marketplace_health_updated, marketplace_conversion_drop
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { MarketplaceIntelligenceRunResult } from "./marketplace-events"

// ── Health Score Computation ──────────────────────────────────────────────────

interface MarketplaceHealthComponents {
  creatorActivity: number       // % active creators (had ≥1 order in 7d)
  conversionHealth: number      // platform avg WA conversion rate normalized
  revenueGrowth: number         // 7d vs prior 7d revenue trend
  onboardingHealth: number      // new creators completing profile setup
  retentionHealth: number       // repeat customer rate across platform
}

function scoreComponent(value: number, max: number): number {
  return Math.min(20, Math.round((value / max) * 20))
}

export async function computeMarketplaceHealthScore(): Promise<{
  overall: number
  components: MarketplaceHealthComponents
  signals: string[]
  activeCreators: number
  totalRevenue30dKobo: number
  avgConversionRate: number
}> {
  const supabase = createAdminClient()
  const sevenDaysAgo  = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString().split("T")[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]

  const signals: string[] = []

  // Current 7d window metrics
  const { data: recent7d } = await supabase
    .from("creator_performance_snapshots")
    .select("creator_id, order_count, revenue_kobo, views, whatsapp_clicks, health_score")
    .gte("snapshot_date", sevenDaysAgo)

  // Prior 7d window (14d → 7d ago) for trend
  const { data: prior7d } = await supabase
    .from("creator_performance_snapshots")
    .select("creator_id, order_count, revenue_kobo")
    .gte("snapshot_date", fourteenDaysAgo)
    .lt("snapshot_date", sevenDaysAgo)

  const rows7d = (recent7d ?? []) as { creator_id: string; order_count: number; revenue_kobo: number; views: number; whatsapp_clicks: number; health_score: number | null }[]
  const priorRows = (prior7d ?? []) as { creator_id: string; order_count: number; revenue_kobo: number }[]

  const activeCreatorIds = new Set(rows7d.filter(r => r.order_count >= 1).map(r => r.creator_id))
  const totalCreators = new Set(rows7d.map(r => r.creator_id)).size
  const activeCreators = activeCreatorIds.size
  const activityRate = totalCreators > 0 ? activeCreators / totalCreators : 0

  const totalViews = rows7d.reduce((s, r) => s + r.views, 0)
  const totalWA    = rows7d.reduce((s, r) => s + r.whatsapp_clicks, 0)
  const avgConversionRate = totalViews > 0 ? totalWA / totalViews : 0

  const totalRevenue7d  = rows7d.reduce((s, r) => s + r.revenue_kobo, 0)
  const priorRevenue7d  = priorRows.reduce((s, r) => s + r.revenue_kobo, 0)
  const revenueGrowthRate = priorRevenue7d > 0
    ? (totalRevenue7d - priorRevenue7d) / priorRevenue7d
    : totalRevenue7d > 0 ? 1 : 0

  // 30d revenue for reporting
  const { data: rev30d } = await supabase
    .from("creator_performance_snapshots")
    .select("revenue_kobo")
    .gte("snapshot_date", thirtyDaysAgo)
  const totalRevenue30dKobo = ((rev30d ?? []) as { revenue_kobo: number }[]).reduce((s, r) => s + r.revenue_kobo, 0)

  // New creator onboarding health
  const { data: newCreators } = await supabase
    .from("creator_profiles")
    .select("id, is_published")
    .gte("created_at", sevenDaysAgo)
  const newCreatorRows = (newCreators ?? []) as { id: string; is_published: boolean }[]
  const publishedNewRate = newCreatorRows.length > 0
    ? newCreatorRows.filter(c => c.is_published).length / newCreatorRows.length
    : 0.5

  // Repeat customer signal from recent metrics
  const { data: repeatMetrics } = await supabase
    .from("creator_metrics_daily")
    .select("orders_created, new_customers")
    .gte("date", sevenDaysAgo)
  const repeatRows = (repeatMetrics ?? []) as { orders_created: number; new_customers: number }[]
  const totalOrders = repeatRows.reduce((s, r) => s + r.orders_created, 0)
  const totalNew    = repeatRows.reduce((s, r) => s + r.new_customers, 0)
  const repeatRate  = totalOrders > 0 ? (totalOrders - totalNew) / totalOrders : 0

  // Score each component out of 20 → total out of 100
  const components: MarketplaceHealthComponents = {
    creatorActivity:  scoreComponent(activityRate, 1),
    conversionHealth: scoreComponent(Math.min(avgConversionRate * 10, 1), 1), // normalize: 10% WA rate = max
    revenueGrowth:    scoreComponent(Math.max(0, revenueGrowthRate + 0.2), 0.4), // -20% = 0, +20% = max
    onboardingHealth: scoreComponent(publishedNewRate, 1),
    retentionHealth:  scoreComponent(repeatRate, 0.4), // 40% repeat rate = max
  }

  const overall = Object.values(components).reduce((s, v) => s + v, 0)

  if (activityRate < 0.3) signals.push("low_creator_activity")
  if (avgConversionRate < 0.03) signals.push("low_conversion_rate")
  if (revenueGrowthRate < -0.1) signals.push("revenue_declining")
  if (overall >= 70) signals.push("healthy_marketplace")

  return { overall, components, signals, activeCreators, totalRevenue30dKobo, avgConversionRate }
}

// ── Platform Conversion Drop Detection ───────────────────────────────────────

export async function detectMarketplaceConversionDrop(): Promise<MarketplaceIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("mkt")
  let eventsEmitted = 0
  const signals: string[] = []
  const today = new Date().toISOString().split("T")[0]

  try {
    const sevenDaysAgo      = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]
    const fourteenDaysAgo   = new Date(Date.now() - 14 * 86_400_000).toISOString().split("T")[0]

    const [current, prior] = await Promise.all([
      supabase.from("creator_metrics_daily")
        .select("storefront_views, whatsapp_clicks")
        .gte("date", sevenDaysAgo),
      supabase.from("creator_metrics_daily")
        .select("storefront_views, whatsapp_clicks")
        .gte("date", fourteenDaysAgo)
        .lt("date", sevenDaysAgo),
    ])

    const sumConv = (rows: { storefront_views: number; whatsapp_clicks: number }[]) => {
      const views = rows.reduce((s, r) => s + r.storefront_views, 0)
      const wa    = rows.reduce((s, r) => s + r.whatsapp_clicks, 0)
      return views > 0 ? wa / views : 0
    }

    const currentRows = (current.data ?? []) as { storefront_views: number; whatsapp_clicks: number }[]
    const priorRows   = (prior.data ?? []) as { storefront_views: number; whatsapp_clicks: number }[]
    const currentRate = sumConv(currentRows)
    const priorRate   = sumConv(priorRows)

    if (priorRate > 0.02 && currentRate < priorRate * 0.8) {
      const dropPercent = Math.round((1 - currentRate / priorRate) * 100)
      const affectedCreators = new Set(
        (current.data ?? []).filter((r: unknown) => {
          const row = r as { storefront_views: number; whatsapp_clicks: number }
          return row.storefront_views > 10 && row.whatsapp_clicks / row.storefront_views < priorRate * 0.8
        }).length > 0 ? ["_"] : []
      ).size

      await emitEvent("marketplace_conversion_drop", {
        tenantId:  "platform",
        correlationId,
      }, {
        previousRate:      priorRate,
        currentRate,
        dropPercent,
        affectedCreators,
        period:            "7d",
        snapshotDate:      today,
      }, `marketplace_conv_drop:${today}`)

      signals.push(`conversion_drop:${dropPercent}%`)
      eventsEmitted++
    }
  } catch (err) {
    logger.error("[marketplace-health] conversion drop detection failed", { error: String(err) })
  }

  return { module: "marketplace-health/conversion", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}

// ── Main Marketplace Health Run ───────────────────────────────────────────────

export async function runMarketplaceHealthEngine(): Promise<MarketplaceIntelligenceRunResult> {
  const start = Date.now()
  const correlationId = generateCorrelationId("mkt")
  const today = new Date().toISOString().split("T")[0]
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    const [health, convDrop] = await Promise.allSettled([
      computeMarketplaceHealthScore(),
      detectMarketplaceConversionDrop(),
    ])

    if (health.status === "fulfilled") {
      const h = health.value
      signals.push(...h.signals)

      await emitEvent("marketplace_health_updated", {
        tenantId:  "platform",
        correlationId,
      }, {
        overallScore:               h.overall,
        activeCreators:             h.activeCreators,
        totalRevenue30dKobo:        h.totalRevenue30dKobo,
        avgConversionRate:          h.avgConversionRate,
        topPerformingCategories:    [],
        riskSignals:                h.signals,
        snapshotDate:               today,
      }, `marketplace_health:${today}`)

      eventsEmitted++
    }

    if (convDrop.status === "fulfilled") {
      eventsEmitted += convDrop.value.eventsEmitted
      signals.push(...convDrop.value.signals)
    }

    logger.info("[marketplace-health] run complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[marketplace-health] engine failed", { error: String(err) })
  }

  return { module: "marketplace-health", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
