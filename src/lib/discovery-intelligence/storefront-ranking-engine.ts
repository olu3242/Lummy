/**
 * Storefront Ranking Engine — assigns discoverability visibility scores to
 * storefronts and emits storefront_discovery_accelerated for high-opportunity stores.
 *
 * Builds on: src/lib/discovery/ranking.ts (trending creators)
 * Reads from: creator_rankings, creator_metrics_daily, creator_trust_scores
 * Emits:      storefront_discovery_accelerated
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { DiscoveryIntelligenceRunResult } from "./discovery-events"

export interface StorefrontVisibilityScore {
  creatorId: string
  visibilityScore: number      // 0-100
  conversionPotential: number  // estimated ₦ revenue if discovery improved
  components: {
    rankScore: number          // from creator_rankings
    trustScore: number         // from creator_trust_scores
    engagementScore: number    // from recent metrics
    conversionRate: number     // current WA/view ratio
  }
}

export async function computeStorefrontVisibility(creatorId: string): Promise<StorefrontVisibilityScore> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split("T")[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]

  const [rankRes, trustRes, metricsRes] = await Promise.allSettled([
    supabase.from("creator_rankings")
      .select("composite_score, percentile, tier")
      .eq("creator_id", creatorId)
      .gte("snapshot_date", sevenDaysAgo)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("creator_trust_scores")
      .select("trust_score")
      .eq("creator_id", creatorId)
      .maybeSingle(),
    supabase.from("creator_metrics_daily")
      .select("storefront_views, whatsapp_clicks, orders_created")
      .eq("creator_id", creatorId)
      .gte("date", sevenDaysAgo)
      .limit(7),
  ])

  const rankData = rankRes.status === "fulfilled"
    ? rankRes.value.data as { composite_score: number; percentile: number; tier: string } | null
    : null
  const trustData = trustRes.status === "fulfilled"
    ? trustRes.value.data as { trust_score: number } | null
    : null
  const metrics = metricsRes.status === "fulfilled"
    ? (metricsRes.value.data ?? []) as { storefront_views: number; whatsapp_clicks: number; orders_created: number }[]
    : []

  const rankScore        = rankData?.composite_score ?? 40
  const trustScore       = trustData?.trust_score ?? 60
  const totalViews       = metrics.reduce((s, m) => s + m.storefront_views, 0)
  const totalWA          = metrics.reduce((s, m) => s + m.whatsapp_clicks, 0)
  const totalOrders      = metrics.reduce((s, m) => s + m.orders_created, 0)
  const conversionRate   = totalViews > 0 ? totalWA / totalViews : 0
  const engagementScore  = Math.min(100, Math.round((totalViews / 50) * 40 + conversionRate * 600))

  const visibilityScore  = Math.round(rankScore * 0.35 + trustScore * 0.25 + engagementScore * 0.4)

  // Estimated revenue potential if reach doubled (simplified)
  const avgOrderValue    = 5000 // ₦5000 avg
  const currentOrders7d  = totalOrders
  const conversionPotential = Math.round(
    (0.08 - conversionRate) * totalViews * avgOrderValue * 100  // kobo
  )

  return {
    creatorId,
    visibilityScore: Math.min(100, visibilityScore),
    conversionPotential: Math.max(0, conversionPotential),
    components: { rankScore, trustScore, engagementScore, conversionRate },
  }
}

export async function runStorefrontRankingEngine(limit = 200): Promise<DiscoveryIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("sfrank")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let creatorsScored = 0

  try {
    const { data: creators } = await supabase
      .from("creator_profiles")
      .select("id, handle")
      .eq("is_published", true)
      .limit(limit)

    for (const c of (creators ?? []) as { id: string; handle: string }[]) {
      try {
        const vis = await computeStorefrontVisibility(c.id)
        creatorsScored++

        // Emit discovery_accelerated for high-opportunity storefronts
        // (good trust + high conversion potential but low visibility)
        if (vis.visibilityScore < 50 && vis.conversionPotential > 50_000_00 && vis.components.trustScore >= 60) {
          await emitEvent("storefront_discovery_accelerated", {
            tenantId: c.id, creatorId: c.id, correlationId,
          }, {
            creatorId:           c.id,
            storefrontHandle:    c.handle,
            visibilityScore:     vis.visibilityScore,
            conversionPotential: vis.conversionPotential,
            snapshotDate:        today,
          }, `sf_discovery:${c.id}:${today}`)
          eventsEmitted++
          signals.push(`sf_boost:${c.handle}:vis${vis.visibilityScore}`)
        }
      } catch (_err) {
        // Individual failures non-fatal
      }
    }

    logger.info("[storefront-ranking] engine complete", { creatorsScored, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[storefront-ranking] engine failed", { error: String(err) })
  }

  return { module: "storefront-ranking", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals, creatorsScored }
}
