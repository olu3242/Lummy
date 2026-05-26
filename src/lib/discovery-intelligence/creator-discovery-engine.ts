/**
 * Creator Discovery Engine — surfaces underexposed high-quality creators
 * and emits discovery boost signals to amplify their reach.
 *
 * Reads from: creator_metrics_daily, creator_health_scores, creator_trust_scores, creator_profiles
 * Emits:      creator_trending, creator_discovery_boost
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { DiscoveryIntelligenceRunResult } from "./discovery-events"

export async function runCreatorDiscoveryEngine(limit = 200): Promise<DiscoveryIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("disc")
  const today = new Date().toISOString().split("T")[0]
  const sevenDaysAgo  = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]
  const priorWeekStart = new Date(Date.now() - 14 * 86_400_000).toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let creatorsScored = 0

  try {
    // Current week metrics
    const { data: currentMetrics } = await supabase
      .from("creator_metrics_daily")
      .select("creator_id, storefront_views, whatsapp_clicks, orders_created")
      .gte("date", sevenDaysAgo)
      .limit(limit * 7)

    // Prior week metrics for trending detection
    const { data: priorMetrics } = await supabase
      .from("creator_metrics_daily")
      .select("creator_id, storefront_views, whatsapp_clicks")
      .gte("date", priorWeekStart)
      .lt("date", sevenDaysAgo)
      .limit(limit * 7)

    type MetricAgg = { views: number; wa: number; orders: number }
    const currentAgg = new Map<string, MetricAgg>()
    const priorAgg   = new Map<string, { views: number; wa: number }>()

    for (const m of (currentMetrics ?? []) as { creator_id: string; storefront_views: number; whatsapp_clicks: number; orders_created: number }[]) {
      const c = currentAgg.get(m.creator_id) ?? { views: 0, wa: 0, orders: 0 }
      c.views  += m.storefront_views
      c.wa     += m.whatsapp_clicks
      c.orders += m.orders_created
      currentAgg.set(m.creator_id, c)
    }

    for (const m of (priorMetrics ?? []) as { creator_id: string; storefront_views: number; whatsapp_clicks: number }[]) {
      const c = priorAgg.get(m.creator_id) ?? { views: 0, wa: 0 }
      c.views += m.storefront_views
      c.wa    += m.whatsapp_clicks
      priorAgg.set(m.creator_id, c)
    }

    // Fetch handles for trending events
    const creatorIds = [...currentAgg.keys()]
    const { data: profiles } = await supabase
      .from("creator_profiles")
      .select("id, handle")
      .in("id", creatorIds.slice(0, 100))
    const handleMap = new Map<string, string>(
      ((profiles ?? []) as { id: string; handle: string }[]).map(p => [p.id, p.handle])
    )

    for (const [creatorId, curr] of currentAgg.entries()) {
      creatorsScored++
      const prior = priorAgg.get(creatorId) ?? { views: 0, wa: 0 }

      // Trending: current week views ≥ 2× prior week AND ≥ 50 views
      if (curr.views >= 50 && prior.views > 0 && curr.views >= prior.views * 2) {
        const trendDriver = curr.wa > prior.wa * 2 ? "wa_surge" :
                            curr.orders > 0        ? "sales_acceleration" :
                            "views_spike"

        await emitEvent("creator_trending", {
          tenantId: creatorId, creatorId, correlationId,
        }, {
          creatorId,
          handle:      handleMap.get(creatorId) ?? creatorId,
          trendScore:  Math.round((curr.views / (prior.views || 1)) * 50),
          trendDriver,
          views7d:     curr.views,
          waClicks7d:  curr.wa,
          snapshotDate: today,
        }, `creator_trending:${creatorId}:${today}`)
        eventsEmitted++
        signals.push(`trending:${creatorId}:${trendDriver}`)
        continue
      }

      // Discovery boost: good quality but underexposed (low views, good conversion)
      const convRate = curr.views > 0 ? curr.wa / curr.views : 0
      if (curr.views >= 10 && curr.views < 100 && convRate >= 0.08 && curr.orders >= 1) {
        await emitEvent("creator_discovery_boost", {
          tenantId: creatorId, creatorId, correlationId,
        }, {
          creatorId,
          reason:                "underexposed_high_quality",
          qualityScore:          Math.round(convRate * 1000),
          estimatedReachBoost:   Math.round((1 - curr.views / 100) * 80),
          snapshotDate:          today,
        }, `discovery_boost:${creatorId}:${today}`)
        eventsEmitted++
        signals.push(`boost:${creatorId}:conv${(convRate * 100).toFixed(0)}%`)
      }
    }

    logger.info("[creator-discovery] engine complete", { creatorsScored, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[creator-discovery] engine failed", { error: String(err) })
  }

  return { module: "creator-discovery", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals, creatorsScored }
}
