import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { StabilityGovRunResult } from "./governance-events"

export async function runGovernanceStabilityEngine(): Promise<StabilityGovRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("governance-stability")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString()

    const { data: rows } = await supabase
      .from("automation_events")
      .select("event_name, priority")
      .in("event_name", [
        "marketplace_governance_risk",
        "marketplace_integrity_risk",
        "governance_intervention_required",
        "marketplace_sustainability_risk",
        "trust_governance_degraded",
        "monetization_governance_alert",
      ])
      .gte("created_at", since24h)

    const events = (rows ?? []) as { event_name: string; priority: number | null }[]
    const totalGovernanceEvents24h = events.length

    if (totalGovernanceEvents24h === 0) {
      return { module: "governance-stability", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: ["no_governance_events_24h"] }
    }

    const criticalCount = events.filter(e => (e.priority ?? 5) <= 2).length
    const highCount = events.filter(e => (e.priority ?? 5) <= 3).length
    const governanceStabilityScore = Math.max(0, 100 - criticalCount * 15 - highCount * 5)

    const nameCounts = new Map<string, number>()
    for (const e of events) {
      nameCounts.set(e.event_name, (nameCounts.get(e.event_name) ?? 0) + 1)
    }
    const primaryRisk = [...nameCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown"

    signals.push(
      `total_governance_events:${totalGovernanceEvents24h}`,
      `critical:${criticalCount}`,
      `high:${highCount}`,
      `stability_score:${governanceStabilityScore}`,
      `primary_risk:${primaryRisk}`,
    )

    if (governanceStabilityScore < 60) {
      await emitEvent(
        "governance_degradation_detected",
        { tenantId: "platform", creatorId: "platform", correlationId },
        { governanceStabilityScore, criticalCount, highCount, primaryRisk, snapshotDate: today },
        "governance_stability:platform:today",
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`governance_degradation:score=${governanceStabilityScore}`)
    }

    logger.info("[governance-stability] engine complete", { governanceStabilityScore, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[governance-stability] engine failed", { error: String(err) })
    return { module: "governance-stability", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }

  return { module: "governance-stability", eventsEmitted, alertsRaised, durationMs: Date.now() - start, signals }
}
