import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ScalingStabRunResult } from "./scaling-events"

export async function runCapacityStabilizationEngine(): Promise<ScalingStabRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("capacity-stabilization")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()

    const { data: rows } = await supabase
      .from("automation_events")
      .select("event_name")
      .in("event_name", ["marketplace_capacity_risk", "scaling_bottleneck_detected"])
      .gte("created_at", since7d)

    const events = (rows ?? []) as { event_name: string }[]
    const total = events.length

    const nameCounts = new Map<string, number>()
    for (const e of events) {
      nameCounts.set(e.event_name, (nameCounts.get(e.event_name) ?? 0) + 1)
    }

    signals.push(
      `capacity_risk_events:${nameCounts.get("marketplace_capacity_risk") ?? 0}`,
      `bottleneck_events:${nameCounts.get("scaling_bottleneck_detected") ?? 0}`,
      `total:${total}`,
    )

    if (total >= 2) {
      const severity = total >= 5 ? "critical" : "warning"
      await emitEvent(
        "scaling_stabilization_required",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          triggerEvent: "capacity_pressure",
          triggerCount: total,
          severity,
          recommendedAction: "Increase creator acquisition and expand marketplace capacity",
          snapshotDate: today,
        },
        "capacity_stabilization:platform:today",
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`capacity_stabilization_required:total=${total}:severity=${severity}`)
    }

    logger.info("[capacity-stabilization] engine complete", { total, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[capacity-stabilization] engine failed", { error: String(err) })
    return { module: "capacity-stabilization", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }

  return { module: "capacity-stabilization", eventsEmitted, alertsRaised, durationMs: Date.now() - start, signals }
}
