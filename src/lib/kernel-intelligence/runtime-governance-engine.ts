import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { KernelRunResult } from "./kernel-events"

export async function runRuntimeGovernanceEngine(): Promise<KernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("runtime-governance")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const now = Date.now()
    const oneDayAgo = new Date(now - 86_400_000).toISOString()
    const twoDaysAgo = new Date(now - 48 * 3600_000).toISOString()
    const fiveMinAgo = new Date(now - 5 * 60_000).toISOString()

    const [
      queueDepthRes,
      deadLetterRes,
      lockLeakRes,
      slaBreachRes,
      totalSlaRes,
      cronProbeRes,
    ] = await Promise.allSettled([
      supabase
        .from("automation_events")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "retrying"])
        .eq("processing", false),
      supabase
        .from("automation_events")
        .select("id", { count: "exact", head: true })
        .eq("status", "dead_letter")
        .gte("created_at", oneDayAgo),
      supabase
        .from("automation_events")
        .select("id", { count: "exact", head: true })
        .eq("processing", true)
        .lt("created_at", fiveMinAgo),
      supabase
        .from("workflow_sla_records")
        .select("id", { count: "exact", head: true })
        .eq("status", "breach")
        .gte("started_at", oneDayAgo),
      supabase
        .from("workflow_sla_records")
        .select("id", { count: "exact", head: true })
        .gte("started_at", oneDayAgo),
      supabase
        .from("automation_events")
        .select("id", { count: "exact", head: true })
        .in("event_name", [
          "ecosystem_revenue_growth",
          "ecosystem_retention_risk",
          "economy_health_updated",
          "marketplace_health_updated",
          "creator_trust_improved",
          "creator_trust_degraded",
        ])
        .gte("created_at", twoDaysAgo),
    ])

    const queueDepth = queueDepthRes.status === "fulfilled" ? (queueDepthRes.value.count ?? 0) : 0
    const deadLetterCount = deadLetterRes.status === "fulfilled" ? (deadLetterRes.value.count ?? 0) : 0
    const lockLeaks = lockLeakRes.status === "fulfilled" ? (lockLeakRes.value.count ?? 0) : 0
    const slaBreaches = slaBreachRes.status === "fulfilled" ? (slaBreachRes.value.count ?? 0) : 0
    const totalSla = totalSlaRes.status === "fulfilled" ? (totalSlaRes.value.count ?? 1) : 1
    const cronProbeCount = cronProbeRes.status === "fulfilled" ? (cronProbeRes.value.count ?? 0) : 0

    const slaBreachRate = slaBreaches / Math.max(totalSla, 1)

    let runtimeGovernanceScore = 100
    if (queueDepth > 500) runtimeGovernanceScore -= 30
    if (deadLetterCount > 20) runtimeGovernanceScore -= 20
    if (slaBreachRate > 0.2) runtimeGovernanceScore -= 25
    if (lockLeaks > 10) runtimeGovernanceScore -= 25
    runtimeGovernanceScore = Math.max(0, runtimeGovernanceScore)

    signals.push(
      `queue_depth:${queueDepth}`,
      `dead_letter:${deadLetterCount}`,
      `lock_leaks:${lockLeaks}`,
      `sla_breach_rate:${Math.round(slaBreachRate * 100)}%`,
      `cron_probe:${cronProbeCount > 0 ? "healthy" : "stale"}`,
      `governance_score:${runtimeGovernanceScore}`,
    )

    if (runtimeGovernanceScore < 60) {
      await emitEvent(
        "governance_intervention_required",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          governanceArea: "runtime_health",
          runtimeGovernanceScore,
          queueDepth,
          deadLetterCount,
          lockLeaks,
          slaBreachRate,
          cronHealthy: cronProbeCount > 0,
          snapshotDate: today,
        },
        `runtime_governance:platform:${today}`,
      )
      eventsEmitted++
      signals.push(`governance_alert:score=${runtimeGovernanceScore}`)
    }

    logger.info("[runtime-governance] engine complete", { runtimeGovernanceScore, eventsEmitted, correlationId })

    return {
      module: "runtime-governance",
      eventsEmitted,
      alertsRaised: eventsEmitted,
      durationMs: Date.now() - start,
      signals,
    }
  } catch (err) {
    logger.error("[runtime-governance] engine failed", { error: String(err) })
    return { module: "runtime-governance", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }
}
