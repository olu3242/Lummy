import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { StabilityRunResult } from "./monetization-continuity-engine"

type HealthSnapshot = {
  snapshot_date: string
  total_gmv_30d_kobo: number
  growth_rate: number
  active_creators: number
  economy_score: number
}

export async function runEcosystemRevenueStabilityEngine(): Promise<StabilityRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("ecosystem-revenue-stability")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const { data: snapshots } = await supabase
      .from("economy_health_snapshots")
      .select("snapshot_date, total_gmv_30d_kobo, growth_rate, active_creators, economy_score")
      .order("snapshot_date", { ascending: false })
      .limit(3)

    if (!snapshots || snapshots.length < 2) {
      signals.push("insufficient_snapshots")
      return { module: "ecosystem-revenue-stability", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals }
    }

    const latest = snapshots[0] as HealthSnapshot
    const prior  = snapshots[1] as HealthSnapshot

    const latestGMV = latest.total_gmv_30d_kobo
    const priorGMV  = prior.total_gmv_30d_kobo
    const growthRate = priorGMV > 0 ? (latestGMV - priorGMV) / priorGMV : 0

    signals.push(`gmv_latest=${latestGMV}:prior=${priorGMV}:growth=${Math.round(growthRate * 100)}pct`)

    if (growthRate < -0.2) {
      await emitEvent(
        "monetization_interruption_detected",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          creatorId: null,
          previousRevenue30dKobo: priorGMV,
          currentRevenue30dKobo: latestGMV,
          interruptionDays: 30,
          snapshotDate: today,
        },
        `ecosystem_revenue_stability:platform:${today}`,
      )
      eventsEmitted++
      signals.push(`ecosystem_decline:${Math.round(growthRate * 100)}pct`)
    } else if (growthRate > 0.1) {
      await emitEvent(
        "ecosystem_revenue_stabilized",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          totalGMV30dKobo: latestGMV,
          growthRate,
          activeCreators: latest.active_creators,
          snapshotDate: today,
        },
        `ecosystem_stable:platform:${today}`,
      )
      eventsEmitted++
      signals.push(`ecosystem_stable:growth=${Math.round(growthRate * 100)}pct`)
    }

    logger.info("[ecosystem-revenue-stability] engine complete", { eventsEmitted, growthRate, correlationId })
  } catch (err) {
    logger.error("[ecosystem-revenue-stability] engine failed", { error: String(err) })
  }

  return {
    module: "ecosystem-revenue-stability",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
  }
}
