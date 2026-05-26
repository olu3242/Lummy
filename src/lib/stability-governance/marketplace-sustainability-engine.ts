import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { StabilityGovRunResult } from "./governance-events"

export async function runMarketplaceSustainabilityEngine(): Promise<StabilityGovRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("marketplace-sustainability")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()

    const { data: rows } = await supabase
      .from("automation_events")
      .select("event_name")
      .in("event_name", [
        "ecosystem_retention_risk",
        "marketplace_governance_risk",
        "marketplace_scaling_bottleneck",
        "monetization_anomaly",
      ])
      .gte("created_at", since7d)

    const events = (rows ?? []) as { event_name: string }[]

    const nameCounts = new Map<string, number>()
    for (const e of events) {
      nameCounts.set(e.event_name, (nameCounts.get(e.event_name) ?? 0) + 1)
    }

    const ecosystemRetentionCount = nameCounts.get("ecosystem_retention_risk") ?? 0
    const marketplaceGovernanceCount = nameCounts.get("marketplace_governance_risk") ?? 0
    const scalingBottleneckCount = nameCounts.get("marketplace_scaling_bottleneck") ?? 0
    const monetizationAnomalyCount = nameCounts.get("monetization_anomaly") ?? 0

    const sustainabilityRiskScore =
      ecosystemRetentionCount * 20 +
      marketplaceGovernanceCount * 15 +
      scalingBottleneckCount * 10 +
      monetizationAnomalyCount * 20

    const breakdown = {
      ecosystemRetentionCount,
      marketplaceGovernanceCount,
      scalingBottleneckCount,
      monetizationAnomalyCount,
    }

    signals.push(
      `sustainability_risk_score:${sustainabilityRiskScore}`,
      `ecosystem_retention:${ecosystemRetentionCount}`,
      `marketplace_governance:${marketplaceGovernanceCount}`,
      `scaling_bottleneck:${scalingBottleneckCount}`,
      `monetization_anomaly:${monetizationAnomalyCount}`,
    )

    if (sustainabilityRiskScore >= 40) {
      await emitEvent(
        "ecosystem_sustainability_risk",
        { tenantId: "platform", creatorId: "platform", correlationId },
        { sustainabilityRiskScore, breakdown, snapshotDate: today },
        "marketplace_sustainability:platform:today",
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`ecosystem_sustainability_risk:score=${sustainabilityRiskScore}`)
    }

    logger.info("[marketplace-sustainability] engine complete", { sustainabilityRiskScore, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[marketplace-sustainability] engine failed", { error: String(err) })
    return { module: "marketplace-sustainability", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }

  return { module: "marketplace-sustainability", eventsEmitted, alertsRaised, durationMs: Date.now() - start, signals }
}
