import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"

interface ScalingKernelRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
}

export async function runAdaptiveScalingEngine(): Promise<ScalingKernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("adaptive-scaling")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()

    const { data: pendingEvents } = await supabase
      .from("automation_events")
      .select("id")
      .in("status", ["pending", "retrying"])
      .eq("processing", false)

    const queueDepth = (pendingEvents ?? []).length

    if (queueDepth > 200) {
      const { data: createdLastHour } = await supabase
        .from("automation_events")
        .select("id")
        .gte("created_at", oneHourAgo)

      const { data: completedLastHour } = await supabase
        .from("automation_events")
        .select("id")
        .in("status", ["completed", "dead_letter"])
        .gte("updated_at", oneHourAgo)

      const addedCount = (createdLastHour ?? []).length
      const processedCount = (completedLastHour ?? []).length
      const growing = addedCount > processedCount

      if (growing) {
        await emitEvent(
          "scaling_coordination_required",
          { tenantId: "platform", creatorId: "platform", correlationId },
          {
            queueDepth,
            growthSignal: "event_queue_growing",
            recommendedAction: "Increase automation processor frequency",
            snapshotDate: today,
          },
          `adaptive_scaling:queue:${today}`,
        )
        eventsEmitted++
        signals.push(`queue_growing:depth=${queueDepth}:added=${addedCount}:processed=${processedCount}`)
      }
    }

    const { data: healthSnapshots } = await supabase
      .from("marketplace_health_snapshots")
      .select("snapshot_date, overall_score, growth_score")
      .order("snapshot_date", { ascending: false })
      .limit(3)

    const snapshots = (healthSnapshots ?? []) as { snapshot_date: string; overall_score: number; growth_score: number }[]

    if (snapshots.length === 3) {
      const [s0, s1, s2] = snapshots
      const declining = s0.overall_score < s1.overall_score && s1.overall_score < s2.overall_score

      if (declining) {
        await emitEvent(
          "marketplace_capacity_risk",
          { tenantId: "platform", creatorId: "platform", correlationId },
          {
            latestScore: s0.overall_score,
            priorScore: s1.overall_score,
            trend: "declining",
            snapshotDate: today,
          },
          `adaptive_scaling:health:${today}`,
        )
        eventsEmitted++
        signals.push(`health_declining:latest=${s0.overall_score}:prior=${s1.overall_score}`)
      }
    }

    logger.info("[adaptive-scaling] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[adaptive-scaling] engine failed", { error: String(err) })
    return { module: "adaptive-scaling", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [String(err)] }
  }

  return { module: "adaptive-scaling", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
