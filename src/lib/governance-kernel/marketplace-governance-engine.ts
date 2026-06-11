import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { KernelRunResult } from "@/lib/kernel-intelligence/kernel-events"

export async function runMarketplaceGovernanceEngine(): Promise<KernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("marketplace-governance")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]

    const { data: snapshots } = await supabase
      .from("marketplace_health_snapshots")
      .select("overall_score, snapshot_date")
      .gte("snapshot_date", sevenDaysAgo)
      .order("snapshot_date", { ascending: false })
      .limit(7)

    if (!snapshots || snapshots.length === 0) {
      return { module: "marketplace-governance", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: ["no_data"] }
    }

    const latest = snapshots[0] as { overall_score: number; snapshot_date: string }
    const oldest = snapshots[snapshots.length - 1] as { overall_score: number; snapshot_date: string }
    const sustainabilityScore = latest.overall_score
    const scoreDrop = oldest.overall_score - latest.overall_score

    signals.push(`sustainability_score:${Math.round(sustainabilityScore)}`, `7d_trend:${scoreDrop > 0 ? "-" : "+"}${Math.round(Math.abs(scoreDrop))}`)

    if (scoreDrop > 10) {
      await emitEvent(
        "marketplace_governance_risk",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          governanceArea: "health_trend",
          scoreDrop: Math.round(scoreDrop),
          currentScore: Math.round(sustainabilityScore),
          priorScore: Math.round(oldest.overall_score),
          snapshotDate: today,
        },
        `marketplace_governance:platform:${today}`,
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`governance_risk:health_drop=${Math.round(scoreDrop)}pts`)
    }

    if (sustainabilityScore < 40) {
      await emitEvent(
        "marketplace_sustainability_risk",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          sustainabilityScore: Math.round(sustainabilityScore),
          threshold: 40,
          snapshotDate: today,
        },
        `marketplace_sustainability:platform:${today}`,
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`sustainability_risk:score=${Math.round(sustainabilityScore)}`)
    }

    logger.info("[marketplace-governance] engine complete", { sustainabilityScore, eventsEmitted, correlationId })

    return {
      module: "marketplace-governance",
      eventsEmitted,
      alertsRaised,
      durationMs: Date.now() - start,
      signals,
    }
  } catch (err) {
    logger.error("[marketplace-governance] engine failed", { error: String(err) })
    return { module: "marketplace-governance", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }
}
