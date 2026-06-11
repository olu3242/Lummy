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

export async function runCategoryCapacityEngine(): Promise<ScalingKernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("category-capacity")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const { data: profiles } = await supabase
      .from("creator_profiles")
      .select("id, niche")
      .eq("is_published", true)

    const creatorNicheMap = new Map<string, string>()
    for (const p of (profiles ?? []) as { id: string; niche: string | null }[]) {
      const niche = (p.niche ?? "").toLowerCase()
      if (!niche) continue
      creatorNicheMap.set(p.id, niche)
    }

    const creatorIds = [...creatorNicheMap.keys()]

    const { data: economyScores } = await supabase
      .from("creator_economy_scores")
      .select("creator_id, order_velocity")
      .in("creator_id", creatorIds.slice(0, 500))

    const nicheVelocitySum = new Map<string, number>()
    const nicheCreatorCount = new Map<string, number>()
    const nicheHighVelocityCount = new Map<string, number>()

    for (const score of (economyScores ?? []) as { creator_id: string; order_velocity: number }[]) {
      const niche = creatorNicheMap.get(score.creator_id)
      if (!niche) continue
      const velocity = score.order_velocity ?? 0
      nicheVelocitySum.set(niche, (nicheVelocitySum.get(niche) ?? 0) + velocity)
      nicheCreatorCount.set(niche, (nicheCreatorCount.get(niche) ?? 0) + 1)
      if (velocity >= 5) {
        nicheHighVelocityCount.set(niche, (nicheHighVelocityCount.get(niche) ?? 0) + 1)
      }
    }

    let emitCount = 0

    for (const [niche, velocitySum] of nicheVelocitySum) {
      if (emitCount >= 5) break

      try {
        const creatorCount = nicheCreatorCount.get(niche) ?? 1
        const avgVelocity = velocitySum / creatorCount

        if (avgVelocity >= 5 && creatorCount <= 3) {
          await emitEvent(
            "scaling_bottleneck_detected",
            { tenantId: "platform", creatorId: "platform", correlationId },
            {
              bottleneckArea: niche,
              bottleneckType: "category_capacity",
              currentVelocity: avgVelocity,
              capacity: creatorCount,
              recommendedAction: "Recruit more creators in this category",
              snapshotDate: today,
            },
            `category_capacity:${niche}:${today}`,
          )
          eventsEmitted++
          emitCount++
          signals.push(`bottleneck:${niche}:avg_velocity=${avgVelocity.toFixed(1)}:creators=${creatorCount}`)
        }
      } catch (err) {
        logger.warn("[category-capacity] niche iteration failed", { niche, error: String(err) })
      }
    }

    logger.info("[category-capacity] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[category-capacity] engine failed", { error: String(err) })
    return { module: "category-capacity", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [String(err)] }
  }

  return { module: "category-capacity", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
