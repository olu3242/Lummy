import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { KernelRunResult } from "@/lib/kernel-intelligence/kernel-events"

export async function runIntegrityGovernanceEngine(): Promise<KernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("integrity-governance")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const { data: snapshots } = await supabase
      .from("marketplace_integrity_snapshots")
      .select("overall_integrity_score, high_risk_creators, snapshot_date")
      .order("snapshot_date", { ascending: false })
      .limit(2)

    if (!snapshots || snapshots.length === 0) {
      return { module: "integrity-governance", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: ["no_data"] }
    }

    type IntegrityRow = { overall_integrity_score: number; high_risk_creators: number; snapshot_date: string }
    const current = snapshots[0] as IntegrityRow
    const prior = snapshots[1] as IntegrityRow | undefined

    signals.push(`integrity_score:${Math.round(current.overall_integrity_score)}`, `high_risk_creators:${current.high_risk_creators}`)

    if (prior) {
      const degradation = current.overall_integrity_score - prior.overall_integrity_score
      signals.push(`7d_degradation:${Math.round(degradation)}`)

      if (degradation < -10) {
        await emitEvent(
          "marketplace_governance_risk",
          { tenantId: "platform", creatorId: "platform", correlationId },
          {
            governanceArea: "integrity_degradation",
            currentScore: Math.round(current.overall_integrity_score),
            priorScore: Math.round(prior.overall_integrity_score),
            degradation: Math.round(degradation),
            snapshotDate: today,
          },
          `integrity_governance:platform:${today}`,
        )
        eventsEmitted++
        alertsRaised++
        signals.push(`integrity_risk:drop=${Math.round(Math.abs(degradation))}pts`)
      }
    }

    if (current.high_risk_creators > 10) {
      await emitEvent(
        "marketplace_sustainability_risk",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          highRiskCreators: current.high_risk_creators,
          integrityScore: Math.round(current.overall_integrity_score),
          snapshotDate: today,
        },
        `integrity_sustainability:platform:${today}`,
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`high_risk_creators:${current.high_risk_creators}`)
    }

    logger.info("[integrity-governance] engine complete", { integrityScore: Math.round(current.overall_integrity_score), eventsEmitted, correlationId })

    return {
      module: "integrity-governance",
      eventsEmitted,
      alertsRaised,
      durationMs: Date.now() - start,
      signals,
    }
  } catch (err) {
    logger.error("[integrity-governance] engine failed", { error: String(err) })
    return { module: "integrity-governance", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }
}
