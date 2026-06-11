/**
 * Monetization Coordinator — identifies specific monetization opportunities
 * per creator and emits creator_monetization_opportunity events.
 *
 * Reads from: creator_metrics_daily, products, orders, creator_health_scores
 * Emits: creator_monetization_opportunity, creator_repeat_customer_growth
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { IntelligenceRunResult } from "@/lib/intelligence/intelligence-events"

export type MonetizationOpportunityType =
  | "high_traffic_low_conversion"
  | "repeat_customer_gap"
  | "product_catalog_gap"
  | "pricing_opportunity"
  | "abandoned_cart_recovery"

// ── Opportunity Detection ─────────────────────────────────────────────────────

export async function detectMonetizationOpportunities(
  limit = 100,
): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("mon")
  let eventsEmitted = 0
  const signals: string[] = []
  const today = new Date().toISOString().split("T")[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]

  try {
    // Find creators with high views but low WhatsApp conversion
    const { data: metrics } = await supabase
      .from("creator_metrics_daily")
      .select("creator_id, storefront_views, whatsapp_clicks, orders_created")
      .gte("date", sevenDaysAgo)
      .limit(limit * 7)

    const creatorMap = new Map<string, { views: number; wa: number; orders: number }>()
    for (const m of (metrics ?? []) as { creator_id: string; storefront_views: number; whatsapp_clicks: number; orders_created: number }[]) {
      const c = creatorMap.get(m.creator_id) ?? { views: 0, wa: 0, orders: 0 }
      c.views  += m.storefront_views
      c.wa     += m.whatsapp_clicks
      c.orders += m.orders_created
      creatorMap.set(m.creator_id, c)
    }

    for (const [creatorId, c] of creatorMap.entries()) {
      const opportunities: { type: MonetizationOpportunityType; title: string; estimatedRevenueKobo: number }[] = []

      // High traffic, low WA conversion
      if (c.views >= 100 && c.wa < c.views * 0.05) {
        const conversionLoss = Math.round(c.views * 0.05 - c.wa) * 5000 * 100  // est ₦5000 avg order
        opportunities.push({
          type: "high_traffic_low_conversion",
          title: `${c.views} store visits but only ${c.wa} WhatsApp clicks — fix your CTA`,
          estimatedRevenueKobo: conversionLoss,
        })
      }

      // Orders but no repeat customers
      if (c.orders >= 3 && c.orders <= 10) {
        opportunities.push({
          type: "repeat_customer_gap",
          title: "Turn first-time buyers into repeat customers",
          estimatedRevenueKobo: c.orders * 3000 * 100,  // est ₦3000 per repeat
        })
      }

      for (const opp of opportunities) {
        await emitEvent("creator_monetization_opportunity", {
          tenantId:  creatorId,
          creatorId,
          correlationId,
        }, {
          opportunityType:     opp.type,
          title:               opp.title,
          estimatedRevenueKobo: opp.estimatedRevenueKobo,
          trafficViews:        c.views,
          waClicks:            c.wa,
          orders:              c.orders,
        }, `monetization_opp:${creatorId}:${opp.type}:${today}`)
        signals.push(`opp:${creatorId}:${opp.type}`)
        eventsEmitted++
      }
    }

    // Detect creators with growing repeat customer rate
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]
    const { data: repeatMetrics } = await supabase
      .from("creator_metrics_daily")
      .select("creator_id, orders_created, new_customers")
      .gte("date", thirtyDaysAgo)
      .limit(limit * 30)

    const repeatMap = new Map<string, { orders: number; newCustomers: number }>()
    for (const m of (repeatMetrics ?? []) as { creator_id: string; orders_created: number; new_customers: number }[]) {
      const c = repeatMap.get(m.creator_id) ?? { orders: 0, newCustomers: 0 }
      c.orders      += m.orders_created
      c.newCustomers += m.new_customers
      repeatMap.set(m.creator_id, c)
    }

    for (const [creatorId, c] of repeatMap.entries()) {
      if (c.orders < 5) continue
      const repeatRate = c.orders > 0 ? (c.orders - c.newCustomers) / c.orders : 0
      if (repeatRate >= 0.3) {
        await emitEvent("creator_repeat_customer_growth", {
          tenantId:  creatorId,
          creatorId,
          correlationId,
        }, {
          repeatRate:    repeatRate * 100,
          orderCount:    c.orders,
          newCustomers:  c.newCustomers,
          repeatCustomers: c.orders - c.newCustomers,
        }, `creator_repeat_growth:${creatorId}:${today}`)
        signals.push(`repeat_growth:${creatorId}:${(repeatRate * 100).toFixed(0)}%`)
        eventsEmitted++
      }
    }
  } catch (err) {
    logger.error("[monetization-coordinator] opportunity detection failed", { error: String(err) })
  }

  return { module: "monetization-coordinator", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
