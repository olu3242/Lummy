import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { KernelRunResult } from "@/lib/kernel-intelligence/kernel-events"

export async function runRetentionGovernanceEngine(): Promise<KernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("retention-governance")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]

    const [snapshotsRes, retentionEventsRes] = await Promise.allSettled([
      supabase
        .from("marketplace_health_snapshots")
        .select("retention_score, snapshot_date")
        .gte("snapshot_date", sevenDaysAgo)
        .order("snapshot_date", { ascending: false })
        .limit(7),
      supabase
        .from("automation_events")
        .select("id", { count: "exact", head: true })
        .eq("event_name", "creator_retention_risk")
        .gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString()),
    ])

    type RetentionRow = { retention_score: number; snapshot_date: string }
    const snapshots = snapshotsRes.status === "fulfilled" ? (snapshotsRes.value.data ?? []) as RetentionRow[] : []
    const retentionRiskCount = retentionEventsRes.status === "fulfilled" ? (retentionEventsRes.value.count ?? 0) : 0

    signals.push(`retention_risk_events_7d:${retentionRiskCount}`)

    if (snapshots.length === 0) {
      return { module: "retention-governance", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: ["no_data"] }
    }

    const currentScore = snapshots[0].retention_score
    const oldestScore = snapshots[snapshots.length - 1].retention_score
    const drop = oldestScore - currentScore

    signals.push(`retention_score:${Math.round(currentScore)}`, `7d_drop:${Math.round(drop)}`)

    if (retentionRiskCount > 20) {
      signals.push(`elevated_retention_risk_events:${retentionRiskCount}`)
    }

    if (currentScore < 40 || drop > 15) {
      await emitEvent(
        "marketplace_governance_risk",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          governanceArea: "retention",
          currentRetentionScore: Math.round(currentScore),
          drop: Math.round(drop),
          retentionRiskEvents7d: retentionRiskCount,
          snapshotDate: today,
        },
        `retention_governance:platform:${today}`,
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`retention_governance_risk:score=${Math.round(currentScore)},drop=${Math.round(drop)}`)
    }

    logger.info("[retention-governance] engine complete", { retentionScore: Math.round(currentScore), eventsEmitted, correlationId })

    return {
      module: "retention-governance",
      eventsEmitted,
      alertsRaised,
      durationMs: Date.now() - start,
      signals,
    }
  } catch (err) {
    logger.error("[retention-governance] engine failed", { error: String(err) })
    return { module: "retention-governance", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }
}
