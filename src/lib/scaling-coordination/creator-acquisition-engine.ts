import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ScalingCoordinationRunResult } from "./scaling-events"

export async function runCreatorAcquisitionEngine(): Promise<ScalingCoordinationRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("creator-acquisition")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const sevenDaysAgo  = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString()

    // ── Niche gap analysis ───────────────────────────────────────────────────
    const { data: profiles } = await supabase
      .from("creator_profiles")
      .select("id, niche")
      .eq("is_published", true)

    const creatorNicheMap = new Map<string, string>()
    const nicheCreatorCount = new Map<string, number>()

    for (const p of (profiles ?? []) as { id: string; niche: string | null }[]) {
      const niche = (p.niche ?? "").toLowerCase()
      if (!niche) continue
      creatorNicheMap.set(p.id, niche)
      nicheCreatorCount.set(niche, (nicheCreatorCount.get(niche) ?? 0) + 1)
    }

    const creatorIds = [...creatorNicheMap.keys()]

    const { data: recent30dOrders } = await supabase
      .from("orders")
      .select("creator_id, total_amount_kobo")
      .eq("status", "completed")
      .gte("created_at", thirtyDaysAgo)
      .in("creator_id", creatorIds.slice(0, 500))

    const nicheRevenue = new Map<string, number>()
    for (const o of (recent30dOrders ?? []) as { creator_id: string; total_amount_kobo: number }[]) {
      const niche = creatorNicheMap.get(o.creator_id)
      if (!niche) continue
      nicheRevenue.set(niche, (nicheRevenue.get(niche) ?? 0) + (o.total_amount_kobo ?? 0))
    }

    // Emit opportunities for high-revenue, low-creator niches (max 3)
    const REVENUE_THRESHOLD_KOBO = 100_000 * 100  // ~$100 threshold in minor units
    const REVENUE_PER_CREATOR    = 50_000 * 100   // ~$50 per creator in minor units

    let opportunityCount = 0
    for (const [niche, total30dRevenue] of nicheRevenue.entries()) {
      if (opportunityCount >= 3) break

      const creatorCount = nicheCreatorCount.get(niche) ?? 0
      if (total30dRevenue > REVENUE_THRESHOLD_KOBO && creatorCount < 5) {
        const estimatedCreatorCount = Math.max(1, Math.round(total30dRevenue / REVENUE_PER_CREATOR))
        const confidence: "high" | "medium" | "low" =
          creatorCount < 3 ? "high" :
          creatorCount < 5 ? "medium" :
          "low"

        await emitEvent("creator_acquisition_opportunity", {
          tenantId: "platform", creatorId: "platform", correlationId,
        }, {
          opportunityType: "niche_gap",
          targetNiche: niche,
          estimatedCreatorCount,
          estimatedRevenueLiftKobo: Math.round(total30dRevenue * 0.5),
          confidence,
          snapshotDate: today,
        }, `creator_acquisition:${niche}:${today}`)
        eventsEmitted++
        opportunityCount++
        signals.push(`niche_gap:${niche}:revenue=${total30dRevenue}:creators=${creatorCount}:${confidence}`)
      }
    }

    // ── Region high growth: platform GMV 7d vs prior 7d ─────────────────────
    const { data: recent7dOrders } = await supabase
      .from("orders")
      .select("creator_id, total_amount_kobo")
      .eq("status", "completed")
      .gte("created_at", sevenDaysAgo)

    const { data: prior7dOrders } = await supabase
      .from("orders")
      .select("creator_id, total_amount_kobo")
      .eq("status", "completed")
      .gte("created_at", fourteenDaysAgo)
      .lt("created_at", sevenDaysAgo)

    const recent7dGMV  = ((recent7dOrders  ?? []) as { total_amount_kobo: number }[]).reduce((s, o) => s + (o.total_amount_kobo ?? 0), 0)
    const prior7dGMV   = ((prior7dOrders   ?? []) as { total_amount_kobo: number }[]).reduce((s, o) => s + (o.total_amount_kobo ?? 0), 0)
    const recent7dCreators = new Set(((recent7dOrders ?? []) as { creator_id: string }[]).map(o => o.creator_id)).size
    const growthRate = prior7dGMV > 0 ? (recent7dGMV - prior7dGMV) / prior7dGMV : 0

    if (growthRate > 0.3) {
      await emitEvent("region_high_growth", {
        tenantId: "platform", creatorId: "platform", correlationId,
      }, {
        region: "Nigeria",
        growthRate,
        creatorCount: recent7dCreators,
        revenueKobo: recent7dGMV,
        snapshotDate: today,
      }, `region_high_growth:nigeria:${today}`)
      eventsEmitted++
      signals.push(`region_high_growth:nigeria:growth=${(growthRate * 100).toFixed(0)}%`)
    }

    logger.info("[creator-acquisition] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[creator-acquisition] engine failed", { error: String(err) })
    return { module: "creator-acquisition", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [String(err)] }
  }

  return { module: "creator-acquisition", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
