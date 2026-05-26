import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { KernelRunResult } from "@/lib/kernel-intelligence/kernel-events"

export async function runMonetizationGovernanceEngine(): Promise<KernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("monetization-governance")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const { data: snapshots } = await supabase
      .from("economy_health_snapshots")
      .select("economy_score, total_gmv_30d_kobo, growth_rate, snapshot_date")
      .order("snapshot_date", { ascending: false })
      .limit(2)

    if (!snapshots || snapshots.length === 0) {
      return { module: "monetization-governance", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: ["no_data"] }
    }

    type EconRow = { economy_score: number; total_gmv_30d_kobo: number; growth_rate: number; snapshot_date: string }
    const current = snapshots[0] as EconRow
    const prior = snapshots[1] as EconRow | undefined

    signals.push(`economy_score:${Math.round(current.economy_score)}`, `gmv_30d_kobo:${current.total_gmv_30d_kobo}`)

    if (current.total_gmv_30d_kobo === 0) {
      await emitEvent(
        "monetization_governance_alert",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          severity: "critical",
          reason: "zero_gmv",
          economyScore: Math.round(current.economy_score),
          totalGmv30dKobo: 0,
          snapshotDate: today,
        },
        `monetization_governance:platform:${today}`,
      )
      eventsEmitted++
      alertsRaised++
      signals.push("monetization_critical:zero_gmv")
    } else if (prior) {
      const scoreDrop = prior.economy_score - current.economy_score
      signals.push(`score_drop:${Math.round(scoreDrop)}`)

      if (scoreDrop > 10) {
        await emitEvent(
          "monetization_governance_alert",
          { tenantId: "platform", creatorId: "platform", correlationId },
          {
            severity: "high",
            reason: "economy_score_drop",
            currentScore: Math.round(current.economy_score),
            priorScore: Math.round(prior.economy_score),
            scoreDrop: Math.round(scoreDrop),
            snapshotDate: today,
          },
          `monetization_governance:platform:${today}`,
        )
        eventsEmitted++
        alertsRaised++
        signals.push(`monetization_alert:drop=${Math.round(scoreDrop)}pts`)
      }
    }

    logger.info("[monetization-governance] engine complete", { economyScore: Math.round(current.economy_score), eventsEmitted, correlationId })

    return {
      module: "monetization-governance",
      eventsEmitted,
      alertsRaised,
      durationMs: Date.now() - start,
      signals,
    }
  } catch (err) {
    logger.error("[monetization-governance] engine failed", { error: String(err) })
    return { module: "monetization-governance", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }
}
