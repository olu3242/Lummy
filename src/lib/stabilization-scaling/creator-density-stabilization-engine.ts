import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ScalingStabRunResult } from "./scaling-events"

export async function runCreatorDensityStabilizationEngine(): Promise<ScalingStabRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("creator-density-stab")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()

    const { data: rows } = await supabase
      .from("automation_events")
      .select("event_name")
      .in("event_name", [
        "creator_density_high_growth",
        "category_saturation_detected",
        "creator_acquisition_opportunity",
      ])
      .gte("created_at", since30d)

    const events = (rows ?? []) as { event_name: string }[]

    const nameCounts = new Map<string, number>()
    for (const e of events) {
      nameCounts.set(e.event_name, (nameCounts.get(e.event_name) ?? 0) + 1)
    }

    const densityGrowthCount = nameCounts.get("creator_density_high_growth") ?? 0
    const saturationCount = nameCounts.get("category_saturation_detected") ?? 0
    const acquisitionOpportunityCount = nameCounts.get("creator_acquisition_opportunity") ?? 0

    signals.push(
      `density_growth:${densityGrowthCount}`,
      `saturation:${saturationCount}`,
      `acquisition_opportunity:${acquisitionOpportunityCount}`,
    )

    if (saturationCount >= 3) {
      await emitEvent(
        "scaling_stabilization_required",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          triggerEvent: "category_saturation",
          triggerCount: saturationCount,
          severity: "warning",
          recommendedAction: "Diversify creator acquisition to underserved niches",
          snapshotDate: today,
        },
        "creator_density_stab:platform:today",
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`saturation_bottleneck:count=${saturationCount}`)
    }

    logger.info("[creator-density-stab] engine complete", { saturationCount, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[creator-density-stab] engine failed", { error: String(err) })
    return { module: "creator-density-stab", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }

  return { module: "creator-density-stab", eventsEmitted, alertsRaised, durationMs: Date.now() - start, signals }
}
