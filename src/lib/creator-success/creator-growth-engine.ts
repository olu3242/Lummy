/**
 * Creator Growth Engine — revenue trend analysis, growth detection,
 * revenue forecasting, repeat purchase forecasting.
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { computeRevenueForecast } from "@/lib/intelligence/creator-intelligence"
import { generateCorrelationId } from "@/lib/observability/correlation"

export interface CreatorGrowthProfile {
  creatorId: string
  revenueTrend: "accelerating" | "growing" | "stable" | "declining"
  growthRatePct: number
  forecastKobo: number
  forecastConfidence: "low" | "medium" | "high"
  repeatPurchaseRate: number
  growthSignals: string[]
}

export async function computeCreatorGrowthProfile(creatorId: string): Promise<CreatorGrowthProfile> {
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("cge")
  const today = new Date().toISOString().split("T")[0]

  // 60 days of daily metrics for growth analysis
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000).toISOString().split("T")[0]
  const { data: metrics } = await supabase
    .from("creator_metrics_daily")
    .select("date, revenue_ngn, orders_created, new_customers")
    .eq("creator_id", creatorId)
    .gte("date", sixtyDaysAgo)
    .order("date", { ascending: true })

  const rows = (metrics ?? []) as { date: string; revenue_ngn: number; orders_created: number; new_customers: number }[]

  if (rows.length < 14) {
    return {
      creatorId,
      revenueTrend: "stable",
      growthRatePct: 0,
      forecastKobo: 0,
      forecastConfidence: "low",
      repeatPurchaseRate: 0,
      growthSignals: ["insufficient_data"],
    }
  }

  const half = Math.floor(rows.length / 2)
  const period1Revenue = rows.slice(0, half).reduce((s, r) => s + r.revenue_ngn, 0)
  const period2Revenue = rows.slice(half).reduce((s, r) => s + r.revenue_ngn, 0)
  const growthRatePct = period1Revenue > 0 ? ((period2Revenue - period1Revenue) / period1Revenue) * 100 : 0

  const revenueTrend: CreatorGrowthProfile["revenueTrend"] =
    growthRatePct >= 40 ? "accelerating" :
    growthRatePct >= 10 ? "growing" :
    growthRatePct >= -5 ? "stable" :
    "declining"

  const { forecastKobo, confidence, trend } = await computeRevenueForecast(creatorId)

  // Repeat purchase rate: orders vs unique customers (simplified)
  const totalOrders = rows.reduce((s, r) => s + r.orders_created, 0)
  const totalNewCustomers = rows.reduce((s, r) => s + r.new_customers, 0)
  const repeatPurchaseRate = totalOrders > 0 && totalNewCustomers > 0
    ? Math.max(0, (totalOrders - totalNewCustomers) / totalOrders)
    : 0

  const growthSignals: string[] = []
  if (growthRatePct >= 30) growthSignals.push("revenue_growth_30pct")
  if (repeatPurchaseRate > 0.3) growthSignals.push("strong_repeat_purchase")
  if (trend === "up") growthSignals.push("positive_revenue_trajectory")
  if (revenueTrend === "accelerating") growthSignals.push("accelerating_growth")

  // Emit growth event if accelerating
  if (revenueTrend === "accelerating") {
    void emitEvent("creator_growth_detected", { tenantId: creatorId, creatorId, correlationId }, {
      growthPct: growthRatePct,
      revenueTrend,
      forecastKobo,
      growthSignals,
    }, `creator_growth_detected:${creatorId}:${today}`).catch(() => {})
  }

  // Emit forecast update
  if (forecastKobo > 0 && confidence !== "low") {
    void emitEvent("creator_revenue_forecast_updated", { tenantId: creatorId, creatorId, correlationId }, {
      forecastKobo,
      confidence,
      trend,
      growthRatePct,
    }, `creator_revenue_forecast:${creatorId}:${today}`).catch(() => {})
  }

  return { creatorId, revenueTrend, growthRatePct, forecastKobo, forecastConfidence: confidence, repeatPurchaseRate, growthSignals }
}
