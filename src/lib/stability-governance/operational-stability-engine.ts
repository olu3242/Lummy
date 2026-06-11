import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { StabilityGovRunResult } from "./governance-events"
import { runGovernanceStabilityEngine } from "./governance-stability-engine"
import { runIntegrityStabilizationEngine } from "./integrity-stabilization-engine"
import { runTrustStabilityEngine } from "./trust-stability-engine"
import { runMarketplaceSustainabilityEngine } from "./marketplace-sustainability-engine"

export async function runOperationalStabilityEngine(): Promise<StabilityGovRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("operational-stability")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString()

    const { data: rows } = await supabase
      .from("automation_events")
      .select("event_name, priority, created_at")
      .in("event_name", [
        "operational_intervention_required",
        "scaling_governance_alert",
        "workflow_at_risk",
        "ai_cost_spike",
        "scaling_coordination_required",
      ])
      .gte("created_at", since24h)
      .order("created_at", { ascending: false })

    const events = (rows ?? []) as { event_name: string; priority: number | null; created_at: string }[]
    const totalCount = events.length
    const criticalCount = events.filter(e => (e.priority ?? 5) <= 2).length
    const topSignal = events[0]?.event_name ?? "none"

    signals.push(
      `total_operational_signals:${totalCount}`,
      `critical:${criticalCount}`,
      `top_signal:${topSignal}`,
    )

    if (criticalCount >= 1 || totalCount >= 5) {
      await emitEvent(
        "operational_instability_detected",
        { tenantId: "platform", creatorId: "platform", correlationId },
        { criticalCount, totalCount, topSignal, snapshotDate: today },
        "operational_stability:platform:today",
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`operational_instability:critical=${criticalCount}:total=${totalCount}`)
    }

    logger.info("[operational-stability] engine complete", { totalCount, criticalCount, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[operational-stability] engine failed", { error: String(err) })
    return { module: "operational-stability", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }

  return { module: "operational-stability", eventsEmitted, alertsRaised, durationMs: Date.now() - start, signals }
}

export async function runStabilityGovernanceOrchestrator(): Promise<StabilityGovRunResult> {
  const start = Date.now()
  const correlationId = generateCorrelationId("stability-governance-orchestrator")
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  const results = await Promise.allSettled([
    runGovernanceStabilityEngine(),
    runIntegrityStabilizationEngine(),
    runTrustStabilityEngine(),
    runMarketplaceSustainabilityEngine(),
    runOperationalStabilityEngine(),
  ])

  for (const result of results) {
    if (result.status === "fulfilled") {
      eventsEmitted += result.value.eventsEmitted
      alertsRaised += result.value.alertsRaised
      signals.push(...result.value.signals.map(s => `[${result.value.module}] ${s}`))
    } else {
      logger.error("[stability-governance-orchestrator] sub-engine failed", { error: String(result.reason), correlationId })
      signals.push(`engine_error:${String(result.reason).slice(0, 80)}`)
    }
  }

  logger.info("[stability-governance-orchestrator] complete", { eventsEmitted, alertsRaised, correlationId })

  return {
    module: "stability-governance-orchestrator",
    eventsEmitted,
    alertsRaised,
    durationMs: Date.now() - start,
    signals,
  }
}
