import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ScalingStabRunResult } from "./scaling-events"

export async function runAdaptiveScalingStabilizationEngine(): Promise<ScalingStabRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("adaptive-scaling-stab")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()

    const { data: rows } = await supabase
      .from("automation_events")
      .select("event_name")
      .in("event_name", ["scaling_coordination_required", "marketplace_capacity_risk"])
      .gte("created_at", since7d)

    const count = (rows ?? []).length

    signals.push(`scaling_pressure_events:${count}`)

    if (count >= 3) {
      const severity = count >= 5 ? "critical" : "warning"
      await emitEvent(
        "scaling_stabilization_required",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          triggerEvent: "scaling_coordination_required",
          triggerCount: count,
          severity,
          recommendedAction: "Review marketplace capacity and scaling bottlenecks",
          snapshotDate: today,
        },
        "adaptive_scaling_stab:platform:today",
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`scaling_stabilization_required:count=${count}:severity=${severity}`)
    }

    logger.info("[adaptive-scaling-stab] engine complete", { count, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[adaptive-scaling-stab] engine failed", { error: String(err) })
    return { module: "adaptive-scaling-stab", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }

  return { module: "adaptive-scaling-stab", eventsEmitted, alertsRaised, durationMs: Date.now() - start, signals }
}
