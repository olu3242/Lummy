import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ScalingStabRunResult } from "./scaling-events"
import { runAdaptiveScalingStabilizationEngine } from "./adaptive-scaling-engine"
import { runCapacityStabilizationEngine } from "./capacity-stabilization-engine"
import { runCreatorDensityStabilizationEngine } from "./creator-density-stabilization-engine"
import { runBottleneckStabilizationEngine } from "./bottleneck-stabilization-engine"

export async function runMonetizationScalingEngine(): Promise<ScalingStabRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("monetization-scaling")
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
        "creator_scaling_opportunity",
        "creator_high_growth",
        "creator_acquisition_opportunity",
      ])
      .gte("created_at", since30d)

    const events = (rows ?? []) as { event_name: string }[]

    const nameCounts = new Map<string, number>()
    for (const e of events) {
      nameCounts.set(e.event_name, (nameCounts.get(e.event_name) ?? 0) + 1)
    }

    const scalingOpportunityCount = nameCounts.get("creator_scaling_opportunity") ?? 0
    const highGrowthCount = nameCounts.get("creator_high_growth") ?? 0
    const acquisitionOpportunityCount = nameCounts.get("creator_acquisition_opportunity") ?? 0

    signals.push(
      `scaling_opportunity:${scalingOpportunityCount}`,
      `high_growth_demand:${highGrowthCount}`,
      `acquisition_opportunity:${acquisitionOpportunityCount}`,
    )

    if (scalingOpportunityCount >= 5 && acquisitionOpportunityCount >= 2) {
      const severity = scalingOpportunityCount >= 10 ? "critical" : "warning"
      await emitEvent(
        "scaling_stabilization_required",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          triggerEvent: "monetization_capacity_gap",
          triggerCount: scalingOpportunityCount,
          severity,
          recommendedAction: "Accelerate creator acquisition — monetization growth outpacing creator supply",
          snapshotDate: today,
        },
        "monetization_scaling:platform:today",
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`monetization_capacity_gap:scaling=${scalingOpportunityCount}:acquisition_gap=${acquisitionOpportunityCount}:severity=${severity}`)
    }

    logger.info("[monetization-scaling] engine complete", { scalingOpportunityCount, acquisitionOpportunityCount, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[monetization-scaling] engine failed", { error: String(err) })
    return { module: "monetization-scaling", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }

  return { module: "monetization-scaling", eventsEmitted, alertsRaised, durationMs: Date.now() - start, signals }
}

export async function runScalingStabilizationOrchestrator(): Promise<ScalingStabRunResult> {
  const start = Date.now()
  const correlationId = generateCorrelationId("scaling-stabilization-orchestrator")
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  const results = await Promise.allSettled([
    runAdaptiveScalingStabilizationEngine(),
    runCapacityStabilizationEngine(),
    runCreatorDensityStabilizationEngine(),
    runBottleneckStabilizationEngine(),
    runMonetizationScalingEngine(),
  ])

  for (const result of results) {
    if (result.status === "fulfilled") {
      eventsEmitted += result.value.eventsEmitted
      alertsRaised += result.value.alertsRaised
      signals.push(...result.value.signals.map(s => `[${result.value.module}] ${s}`))
    } else {
      logger.error("[scaling-stabilization-orchestrator] sub-engine failed", { error: String(result.reason), correlationId })
      signals.push(`engine_error:${String(result.reason).slice(0, 80)}`)
    }
  }

  logger.info("[scaling-stabilization-orchestrator] complete", { eventsEmitted, alertsRaised, correlationId })

  return {
    module: "scaling-stabilization-orchestrator",
    eventsEmitted,
    alertsRaised,
    durationMs: Date.now() - start,
    signals,
  }
}
