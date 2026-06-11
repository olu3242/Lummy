import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { StabilityGovRunResult } from "./governance-events"

export async function runIntegrityStabilizationEngine(): Promise<StabilityGovRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("integrity-stabilization")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const since48h = new Date(Date.now() - 48 * 3_600_000).toISOString()

    const { data: rows } = await supabase
      .from("automation_events")
      .select("event_name")
      .in("event_name", [
        "marketplace_integrity_risk",
        "marketplace_trust_degradation",
        "dispute_spike_detected",
        "customer_fraud_risk",
      ])
      .gte("created_at", since48h)

    const events = (rows ?? []) as { event_name: string }[]
    const integrityRiskCount = events.length

    const nameCounts = new Map<string, number>()
    for (const e of events) {
      nameCounts.set(e.event_name, (nameCounts.get(e.event_name) ?? 0) + 1)
    }

    signals.push(`integrity_risk_count:${integrityRiskCount}`)

    if (integrityRiskCount >= 3) {
      await emitEvent(
        "marketplace_stability_risk",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          integrityRiskCount,
          breakdown: {
            marketplace_integrity_risk: nameCounts.get("marketplace_integrity_risk") ?? 0,
            dispute_spike_detected: nameCounts.get("dispute_spike_detected") ?? 0,
            customer_fraud_risk: nameCounts.get("customer_fraud_risk") ?? 0,
          },
          snapshotDate: today,
        },
        "integrity_stabilization:platform:today",
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`marketplace_stability_risk:count=${integrityRiskCount}`)
    }

    logger.info("[integrity-stabilization] engine complete", { integrityRiskCount, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[integrity-stabilization] engine failed", { error: String(err) })
    return { module: "integrity-stabilization", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }

  return { module: "integrity-stabilization", eventsEmitted, alertsRaised, durationMs: Date.now() - start, signals }
}
