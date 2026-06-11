import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ScalingCoordinationRunResult } from "./scaling-events"

export async function runScalingGovernanceEngine(): Promise<ScalingCoordinationRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("scaling-governance")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString()

    // ── Event queue depth: unprocessed pending/retrying events ───────────────
    const { data: pendingEvents } = await supabase
      .from("automation_events")
      .select("id")
      .eq("processed", false)
      .in("status", ["pending", "retrying"])

    const queueDepth = (pendingEvents ?? []).length

    if (queueDepth > 500) {
      const severity = queueDepth > 1000 ? "critical" : "warning"

      await emitEvent("scaling_governance_alert", {
        tenantId: "platform", creatorId: "platform", correlationId,
      }, {
        governanceArea: "event_queue_depth",
        currentValue: queueDepth,
        thresholdValue: 500,
        severity,
        recommendedAction: "Increase cron frequency or batch size",
        snapshotDate: today,
      }, `governance_alert:event_queue_depth:${today}`)
      eventsEmitted++
      signals.push(`event_queue_depth:count=${queueDepth}:${severity}`)
    }

    // ── SLA breach rate in last 24h ──────────────────────────────────────────
    const { data: slaBreaches } = await supabase
      .from("workflow_sla_records")
      .select("id")
      .eq("status", "breach")
      .gte("created_at", oneDayAgo)

    const slaBreachCount = (slaBreaches ?? []).length

    if (slaBreachCount > 10) {
      const severity = slaBreachCount > 50 ? "critical" : "warning"

      await emitEvent("scaling_governance_alert", {
        tenantId: "platform", creatorId: "platform", correlationId,
      }, {
        governanceArea: "sla_breach",
        currentValue: slaBreachCount,
        thresholdValue: 10,
        severity,
        recommendedAction: "Review handler performance and retry logic",
        snapshotDate: today,
      }, `governance_alert:sla_breach:${today}`)
      eventsEmitted++
      signals.push(`sla_breach:count=${slaBreachCount}:${severity}`)
    }

    // ── Dead-letter events in last 24h (cron_overload signal, log only) ──────
    const { data: deadLetterEvents } = await supabase
      .from("automation_events")
      .select("id")
      .eq("status", "dead_letter")
      .gte("created_at", oneDayAgo)

    const deadLetterCount = (deadLetterEvents ?? []).length

    if (deadLetterCount > 20) {
      logger.warn("[scaling-governance] high dead-letter count detected", { deadLetterCount, correlationId })
      signals.push(`dead_letter:count=${deadLetterCount}`)
    }

    logger.info("[scaling-governance] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[scaling-governance] engine failed", { error: String(err) })
    return { module: "scaling-governance", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [String(err)] }
  }

  return { module: "scaling-governance", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
