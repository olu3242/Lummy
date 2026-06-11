/**
 * Engagement Ranking Engine — ranks creators by engagement quality
 * (not raw numbers) and surfaces recommendations for low-engagement storefronts.
 *
 * Reads from: creator_metrics_daily, creator_profiles
 * Emits:      storefront_recommendation_generated, customer_referral_detected
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { DiscoveryIntelligenceRunResult } from "./discovery-events"

export interface EngagementRankEntry {
  creatorId: string
  engagementScore: number    // 0-100
  conversionQuality: number  // WA/view ratio normalized
  orderEfficiency: number    // orders per WA click
  consistencyScore: number   // day-to-day variance
}

export async function rankByEngagementQuality(limit = 200): Promise<EngagementRankEntry[]> {
  const supabase = createAdminClient()
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString().split("T")[0]

  const { data: metrics } = await supabase
    .from("creator_metrics_daily")
    .select("creator_id, storefront_views, whatsapp_clicks, orders_created, date")
    .gte("date", fourteenDaysAgo)
    .limit(limit * 14)

  type DayMetric = { views: number; wa: number; orders: number }
  const creatorDays = new Map<string, DayMetric[]>()
  for (const m of (metrics ?? []) as { creator_id: string; storefront_views: number; whatsapp_clicks: number; orders_created: number; date: string }[]) {
    if (!creatorDays.has(m.creator_id)) creatorDays.set(m.creator_id, [])
    creatorDays.get(m.creator_id)!.push({
      views: m.storefront_views, wa: m.whatsapp_clicks, orders: m.orders_created,
    })
  }

  const ranked: EngagementRankEntry[] = []

  for (const [creatorId, days] of creatorDays.entries()) {
    const totalViews  = days.reduce((s, d) => s + d.views, 0)
    const totalWA     = days.reduce((s, d) => s + d.wa, 0)
    const totalOrders = days.reduce((s, d) => s + d.orders, 0)

    if (totalViews < 5) continue

    const conversionQuality = totalViews > 0 ? Math.min(100, (totalWA / totalViews) * 1000) : 0
    const orderEfficiency   = totalWA > 0    ? Math.min(100, (totalOrders / totalWA) * 400) : 0

    // Consistency: low variance in daily views = consistent engagement
    const viewPerDay = days.map(d => d.views)
    const mean = viewPerDay.reduce((s, v) => s + v, 0) / viewPerDay.length
    const stdDev = Math.sqrt(viewPerDay.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / viewPerDay.length)
    const consistencyScore = mean > 0 ? Math.max(0, 100 - (stdDev / mean) * 100) : 50

    const engagementScore = Math.round(
      conversionQuality * 0.4 + orderEfficiency * 0.35 + consistencyScore * 0.25
    )

    ranked.push({ creatorId, engagementScore, conversionQuality, orderEfficiency, consistencyScore })
  }

  return ranked.sort((a, b) => b.engagementScore - a.engagementScore)
}

export async function runEngagementRankingEngine(limit = 200): Promise<DiscoveryIntelligenceRunResult> {
  const start = Date.now()
  const correlationId = generateCorrelationId("engage")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const ranked = await rankByEngagementQuality(limit)

    // Top 10% get storefront recommendations generated
    const topTenth = Math.max(1, Math.floor(ranked.length * 0.1))
    for (const r of ranked.slice(0, topTenth)) {
      await emitEvent("storefront_recommendation_generated", {
        tenantId: r.creatorId, creatorId: r.creatorId, correlationId,
      }, {
        creatorId:           r.creatorId,
        recommendationType:  "high_converting",
        confidence:          r.engagementScore >= 70 ? "high" : "medium",
        snapshotDate:        today,
      }, `sf_rec:${r.creatorId}:${today}`)
      eventsEmitted++
      signals.push(`top_engage:${r.creatorId}:${r.engagementScore}`)
    }

    // Check referral detection using ecosystem participation data
    const supabase = (await import("@/lib/supabase/server")).createAdminClient()
    const { data: referrals } = await supabase
      .from("creator_referrals")
      .select("referrer_id, referred_id, status")
      .eq("status", "converted")
      .gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
      .limit(50)

    const referralsByReferrer = new Map<string, number>()
    for (const r of (referrals ?? []) as { referrer_id: string }[]) {
      referralsByReferrer.set(r.referrer_id, (referralsByReferrer.get(r.referrer_id) ?? 0) + 1)
    }

    for (const [referrerId, count] of referralsByReferrer.entries()) {
      await emitEvent("customer_referral_detected", {
        tenantId: referrerId, creatorId: referrerId, correlationId,
      }, {
        creatorId:                 referrerId,
        referralCount:             count,
        estimatedRevenueLiftKobo:  count * 300_000,  // ₦3000 avg per referral in kobo
        snapshotDate:              today,
      }, `referral_detected:${referrerId}:${today}`)
      eventsEmitted++
    }

    logger.info("[engagement-ranking] engine complete", { ranked: ranked.length, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[engagement-ranking] engine failed", { error: String(err) })
  }

  return { module: "engagement-ranking", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals }
}
