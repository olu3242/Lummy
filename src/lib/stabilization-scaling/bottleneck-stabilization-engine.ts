import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ScalingStabRunResult } from "./scaling-events"

export async function runBottleneckStabilizationEngine(): Promise<ScalingStabRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("bottleneck-stabilization")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString()

    const { data: rows } = await supabase
      .from("automation_events")
      .select("event_name")
      .in("event_name", [
        "marketplace_scaling_bottleneck",
        "scaling_governance_alert",
        "workflow_at_risk",
        "workflow_retry_spike",
      ])
      .gte("created_at", since24h)

    const events = (rows ?? []) as { event_name: string }[]

    const nameCounts = new Map<string, number>()
    for (const e of events) {
      nameCounts.set(e.event_name, (nameCounts.get(e.event_name) ?? 0) + 1)
    }

    const workflowCount =
      (nameCounts.get("workflow_at_risk") ?? 0) +
      (nameCounts.get("workflow_retry_spike") ?? 0)

    const marketplaceCount =
      (nameCounts.get("marketplace_scaling_bottleneck") ?? 0) +
      (nameCounts.get("scaling_governance_alert") ?? 0)

    signals.push(
      `workflow_bottleneck_count:${workflowCount}`,
      `marketplace_bottleneck_count:${marketplaceCount}`,
    )

    if (workflowCount >= 3) {
      await emitEvent(
        "workflow_stabilization_required",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          triggerEvent: "workflow_bottleneck",
          triggerCount: workflowCount,
          severity: "critical",
          recommendedAction: "Increase automation processor frequency or batch size",
          snapshotDate: today,
        },
        "workflow_stabilization:platform:today",
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`workflow_stabilization_required:count=${workflowCount}`)
    }

    if (marketplaceCount >= 2) {
      await emitEvent(
        "scaling_stabilization_required",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          triggerEvent: "marketplace_bottleneck",
          triggerCount: marketplaceCount,
          severity: marketplaceCount >= 5 ? "critical" : "warning",
          recommendedAction: "Investigate marketplace scaling bottlenecks",
          snapshotDate: today,
        },
        "bottleneck_stabilization:platform:today",
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`marketplace_scaling_stabilization_required:count=${marketplaceCount}`)
    }

    logger.info("[bottleneck-stabilization] engine complete", { workflowCount, marketplaceCount, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[bottleneck-stabilization] engine failed", { error: String(err) })
    return { module: "bottleneck-stabilization", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }

  return { module: "bottleneck-stabilization", eventsEmitted, alertsRaised, durationMs: Date.now() - start, signals }
}
