import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { StabilityGovRunResult } from "./governance-events"

export async function runTrustStabilityEngine(): Promise<StabilityGovRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("trust-stability")
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
        "creator_trust_degraded",
        "trust_governance_degraded",
        "creator_fulfillment_risk",
        "creator_dispute_risk",
      ])
      .gte("created_at", since48h)

    const events = (rows ?? []) as { event_name: string }[]
    const degradationCount = events.length

    const nameCounts = new Map<string, number>()
    for (const e of events) {
      nameCounts.set(e.event_name, (nameCounts.get(e.event_name) ?? 0) + 1)
    }

    signals.push(`trust_degradation_count:${degradationCount}`)

    if (degradationCount >= 5) {
      await emitEvent(
        "trust_stability_degraded",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          degradationCount,
          signalBreakdown: {
            creator_trust_degraded: nameCounts.get("creator_trust_degraded") ?? 0,
            trust_governance_degraded: nameCounts.get("trust_governance_degraded") ?? 0,
            creator_fulfillment_risk: nameCounts.get("creator_fulfillment_risk") ?? 0,
          },
          snapshotDate: today,
        },
        "trust_stability:platform:today",
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`trust_stability_degraded:count=${degradationCount}`)
    }

    logger.info("[trust-stability] engine complete", { degradationCount, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[trust-stability] engine failed", { error: String(err) })
    return { module: "trust-stability", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }

  return { module: "trust-stability", eventsEmitted, alertsRaised, durationMs: Date.now() - start, signals }
}
