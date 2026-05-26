import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"

interface ScalingKernelRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
}

export async function runCreatorDensityEngine(): Promise<ScalingKernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("creator-density")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

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

    const { data: recentOrders } = await supabase
      .from("orders")
      .select("creator_id, total_amount")
      .eq("status", "completed")
      .gte("created_at", thirtyDaysAgo)
      .in("creator_id", creatorIds.slice(0, 500))

    const nicheRevenue = new Map<string, number>()
    for (const o of (recentOrders ?? []) as { creator_id: string; total_amount: number }[]) {
      const niche = creatorNicheMap.get(o.creator_id)
      if (!niche) continue
      nicheRevenue.set(niche, (nicheRevenue.get(niche) ?? 0) + (o.total_amount ?? 0))
    }

    const sortedNiches = [...nicheRevenue.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    for (const [niche, totalNicheRevenue] of sortedNiches) {
      try {
        const creatorCount = nicheCreatorCount.get(niche) ?? 0
        const revenuePerCreator = totalNicheRevenue / Math.max(creatorCount, 1)

        if (creatorCount >= 20 && revenuePerCreator < 100_000_00) {
          await emitEvent(
            "category_saturation_detected",
            { tenantId: "platform", creatorId: "platform", correlationId },
            {
              niche,
              creatorCount,
              revenuePerCreatorKobo: revenuePerCreator,
              snapshotDate: today,
            },
            `category_saturation:${niche}:${today}`,
          )
          eventsEmitted++
          signals.push(`saturation:${niche}:creators=${creatorCount}:rev_per_creator=${Math.round(revenuePerCreator)}`)
        } else if (creatorCount <= 5 && totalNicheRevenue > 500_000_00) {
          await emitEvent(
            "creator_density_high_growth",
            { tenantId: "platform", creatorId: "platform", correlationId },
            {
              niche,
              creatorCount,
              totalRevenueKobo: totalNicheRevenue,
              growthSignal: "underserved_niche",
              snapshotDate: today,
            },
            `creator_density:${niche}:${today}`,
          )
          eventsEmitted++
          signals.push(`high_growth:${niche}:creators=${creatorCount}:revenue=${totalNicheRevenue}`)
        }
      } catch (err) {
        logger.warn("[creator-density] niche iteration failed", { niche, error: String(err) })
      }
    }

    logger.info("[creator-density] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[creator-density] engine failed", { error: String(err) })
    return { module: "creator-density", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [String(err)] }
  }

  return { module: "creator-density", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
