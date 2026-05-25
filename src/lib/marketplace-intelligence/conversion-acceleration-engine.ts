/**
 * Conversion Acceleration Engine — detects platform-wide conversion bottlenecks
 * and surfaces the top improvement opportunities across the marketplace.
 *
 * Reads from: creator_metrics_daily, creator_performance_snapshots
 * Returns: structured conversion report (consumed by ecosystem intelligence)
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import type { MarketplaceIntelligenceRunResult } from "./marketplace-events"

export interface ConversionBottleneck {
  stage: "view_to_wa" | "wa_to_order" | "order_to_repeat"
  platformRate: number          // current platform average rate
  benchmarkRate: number         // target/expected rate
  gapPercent: number            // how far below benchmark
  affectedCreators: number
  estimatedRevenueLossKobo: number
}

export interface ConversionAccelerationReport {
  analysisDate: string
  topBottleneck: ConversionBottleneck | null
  allBottlenecks: ConversionBottleneck[]
  topOpportunityCreators: string[]  // creators closest to benchmark with most traffic
  platformConversionScore: number   // 0-100
}

const BENCHMARKS = {
  view_to_wa:      0.08,  // 8% WA click rate (industry benchmark for social commerce)
  wa_to_order:     0.25,  // 25% of WA clicks → orders
  order_to_repeat: 0.30,  // 30% repeat customer rate
}

export async function analyzeConversionBottlenecks(): Promise<ConversionAccelerationReport> {
  const supabase = createAdminClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]
  const today = new Date().toISOString().split("T")[0]

  const { data: metrics } = await supabase
    .from("creator_metrics_daily")
    .select("creator_id, storefront_views, whatsapp_clicks, orders_created, new_customers")
    .gte("date", sevenDaysAgo)

  const creatorAgg = new Map<string, { views: number; wa: number; orders: number; newCustomers: number }>()
  for (const m of (metrics ?? []) as { creator_id: string; storefront_views: number; whatsapp_clicks: number; orders_created: number; new_customers: number }[]) {
    const c = creatorAgg.get(m.creator_id) ?? { views: 0, wa: 0, orders: 0, newCustomers: 0 }
    c.views       += m.storefront_views
    c.wa          += m.whatsapp_clicks
    c.orders      += m.orders_created
    c.newCustomers += m.new_customers
    creatorAgg.set(m.creator_id, c)
  }

  const creators = [...creatorAgg.entries()].map(([id, c]) => ({ id, ...c }))
  const activeCreators = creators.filter(c => c.views >= 10)

  // Platform aggregates
  const totalViews  = activeCreators.reduce((s, c) => s + c.views, 0)
  const totalWA     = activeCreators.reduce((s, c) => s + c.wa, 0)
  const totalOrders = activeCreators.reduce((s, c) => s + c.orders, 0)
  const totalNew    = activeCreators.reduce((s, c) => s + c.newCustomers, 0)

  const viewToWA      = totalViews > 0  ? totalWA / totalViews : 0
  const waToOrder     = totalWA > 0     ? totalOrders / totalWA : 0
  const orderToRepeat = totalOrders > 0 ? (totalOrders - totalNew) / totalOrders : 0

  const bottlenecks: ConversionBottleneck[] = []

  // View → WA bottleneck
  if (viewToWA < BENCHMARKS.view_to_wa * 0.75) {
    const affectedCount = activeCreators.filter(c => c.views > 0 && c.wa / c.views < BENCHMARKS.view_to_wa * 0.75).length
    bottlenecks.push({
      stage: "view_to_wa",
      platformRate: viewToWA,
      benchmarkRate: BENCHMARKS.view_to_wa,
      gapPercent: Math.round((1 - viewToWA / BENCHMARKS.view_to_wa) * 100),
      affectedCreators: affectedCount,
      estimatedRevenueLossKobo: Math.round((BENCHMARKS.view_to_wa - viewToWA) * totalViews * 5000 * 100),
    })
  }

  // WA → Order bottleneck
  if (waToOrder < BENCHMARKS.wa_to_order * 0.75 && totalWA > 100) {
    const affectedCount = activeCreators.filter(c => c.wa > 5 && c.orders / c.wa < BENCHMARKS.wa_to_order * 0.75).length
    bottlenecks.push({
      stage: "wa_to_order",
      platformRate: waToOrder,
      benchmarkRate: BENCHMARKS.wa_to_order,
      gapPercent: Math.round((1 - waToOrder / BENCHMARKS.wa_to_order) * 100),
      affectedCreators: affectedCount,
      estimatedRevenueLossKobo: Math.round((BENCHMARKS.wa_to_order - waToOrder) * totalWA * 5000 * 100),
    })
  }

  // Order → Repeat bottleneck
  if (orderToRepeat < BENCHMARKS.order_to_repeat * 0.75 && totalOrders > 50) {
    bottlenecks.push({
      stage: "order_to_repeat",
      platformRate: orderToRepeat,
      benchmarkRate: BENCHMARKS.order_to_repeat,
      gapPercent: Math.round((1 - orderToRepeat / BENCHMARKS.order_to_repeat) * 100),
      affectedCreators: activeCreators.filter(c => c.orders >= 3).length,
      estimatedRevenueLossKobo: Math.round((BENCHMARKS.order_to_repeat - orderToRepeat) * totalOrders * 3000 * 100),
    })
  }

  // Sort by revenue impact
  bottlenecks.sort((a, b) => b.estimatedRevenueLossKobo - a.estimatedRevenueLossKobo)

  // Top opportunity creators: high traffic, close to benchmark
  const topOpportunity = activeCreators
    .filter(c => {
      const rate = c.views > 0 ? c.wa / c.views : 0
      return c.views >= 100 && rate >= BENCHMARKS.view_to_wa * 0.5 && rate < BENCHMARKS.view_to_wa
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)
    .map(c => c.id)

  // Platform conversion score (weighted average of how close we are to benchmarks)
  const scoreViewWA   = Math.min(1, viewToWA / BENCHMARKS.view_to_wa)
  const scoreWAOrder  = Math.min(1, waToOrder / BENCHMARKS.wa_to_order)
  const scoreRepeat   = Math.min(1, orderToRepeat / BENCHMARKS.order_to_repeat)
  const platformConversionScore = Math.round((scoreViewWA * 0.4 + scoreWAOrder * 0.35 + scoreRepeat * 0.25) * 100)

  return {
    analysisDate:            today,
    topBottleneck:           bottlenecks[0] ?? null,
    allBottlenecks:          bottlenecks,
    topOpportunityCreators:  topOpportunity,
    platformConversionScore,
  }
}

export async function runConversionAccelerationEngine(): Promise<MarketplaceIntelligenceRunResult & { report: ConversionAccelerationReport }> {
  const start = Date.now()
  const signals: string[] = []

  try {
    const report = await analyzeConversionBottlenecks()

    for (const b of report.allBottlenecks) {
      signals.push(`bottleneck:${b.stage}:gap${b.gapPercent}%`)
    }
    if (report.platformConversionScore < 50) signals.push(`low_platform_conversion:${report.platformConversionScore}`)

    logger.info("[conversion-acceleration] analysis complete", {
      bottlenecks: report.allBottlenecks.length,
      platformScore: report.platformConversionScore,
      topOpportunity: report.topOpportunityCreators.length,
    })

    return {
      module: "conversion-acceleration",
      eventsEmitted: 0,
      alertsRaised: report.allBottlenecks.length,
      durationMs: Date.now() - start,
      signals,
      report,
    }
  } catch (err) {
    logger.error("[conversion-acceleration] engine failed", { error: String(err) })
    const emptyReport: ConversionAccelerationReport = {
      analysisDate: new Date().toISOString().split("T")[0],
      topBottleneck: null,
      allBottlenecks: [],
      topOpportunityCreators: [],
      platformConversionScore: 0,
    }
    return { module: "conversion-acceleration", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [], report: emptyReport }
  }
}
