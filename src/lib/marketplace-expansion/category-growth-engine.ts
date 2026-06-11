/**
 * Category Growth Engine — identifies high-growth product categories
 * on the platform and surfaces expansion opportunities.
 *
 * Reads from: products, orders, creator_profiles
 * Emits:      category_high_growth
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ExpansionIntelligenceRunResult } from "./expansion-events"

export async function runCategoryGrowthEngine(): Promise<ExpansionIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("cat")
  const today = new Date().toISOString().split("T")[0]
  const thirtyDaysAgo  = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const sixtyDaysAgo   = new Date(Date.now() - 60 * 86_400_000).toISOString()
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    // Orders by niche/category in current 30d
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("creator_id, status, amount_kobo, created_at")
      .eq("status", "completed")
      .gte("created_at", thirtyDaysAgo)
      .limit(1000)

    // Orders in prior 30d
    const { data: priorOrders } = await supabase
      .from("orders")
      .select("creator_id, amount_kobo")
      .eq("status", "completed")
      .gte("created_at", sixtyDaysAgo)
      .lt("created_at", thirtyDaysAgo)
      .limit(1000)

    // Creator → niche mapping
    const { data: profiles } = await supabase
      .from("creator_profiles")
      .select("id, niche")
      .not("niche", "is", null)

    const nicheMap = new Map<string, string>(
      ((profiles ?? []) as { id: string; niche: string }[]).map(p => [p.id, p.niche])
    )

    // Aggregate by niche
    type NicheStats = { revenue: number; creators: Set<string>; orders: number }
    const currentByNiche = new Map<string, NicheStats>()
    const priorByNiche   = new Map<string, { revenue: number }>()

    for (const o of (recentOrders ?? []) as { creator_id: string; amount_kobo: number }[]) {
      const niche = nicheMap.get(o.creator_id) ?? "other"
      const c = currentByNiche.get(niche) ?? { revenue: 0, creators: new Set(), orders: 0 }
      c.revenue += o.amount_kobo ?? 0
      c.creators.add(o.creator_id)
      c.orders++
      currentByNiche.set(niche, c)
    }

    for (const o of (priorOrders ?? []) as { creator_id: string; amount_kobo: number }[]) {
      const niche = nicheMap.get(o.creator_id) ?? "other"
      const c = priorByNiche.get(niche) ?? { revenue: 0 }
      c.revenue += o.amount_kobo ?? 0
      priorByNiche.set(niche, c)
    }

    // Detect high-growth categories (≥30% revenue growth, ≥3 orders)
    for (const [niche, stats] of currentByNiche.entries()) {
      if (stats.orders < 3) continue
      const prior = priorByNiche.get(niche) ?? { revenue: 0 }
      const growthRate = prior.revenue > 0
        ? (stats.revenue - prior.revenue) / prior.revenue
        : stats.revenue > 0 ? 1 : 0

      if (growthRate >= 0.3) {
        const opportunityScore = Math.min(100, Math.round(growthRate * 50 + stats.creators.size * 5))

        await emitEvent("category_high_growth", {
          tenantId: "platform", correlationId,
        }, {
          category:           niche,
          growthRate,
          totalCreators:      stats.creators.size,
          totalRevenue30dKobo: stats.revenue,
          opportunityScore,
          snapshotDate:       today,
        }, `category_growth:${niche}:${today}`)
        eventsEmitted++
        signals.push(`growth:${niche}:${(growthRate * 100).toFixed(0)}%:${stats.creators.size}creators`)
      }
    }

    logger.info("[category-growth] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[category-growth] engine failed", { error: String(err) })
  }

  return { module: "category-growth", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals }
}
