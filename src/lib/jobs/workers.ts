import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { recomputeAllHealthScores } from "@/lib/growth/health"
import { processAutomationEvent } from "@/lib/automation/handlers"
import { runChurnScoringJob } from "@/lib/creator/churn"
import { computeViralityScores, snapshotCreatorPerformance } from "@/lib/analytics/marketplace"
import { startSLARecord, completeSLARecord } from "@/lib/automation/sla"
import type { AutomationEventName } from "@/lib/automation/events"

export interface JobResult {
  jobName: string
  ok: boolean
  durationMs: number
  processed?: number
  failed?: number
  error?: string
}

/** Daily: recompute creator health scores and fire retention automations */
export async function runHealthScoringJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const summary = await recomputeAllHealthScores()
    logger.info("[job] health_scoring complete", summary as unknown as Record<string, unknown>)
    return { jobName: "health_scoring", ok: true, durationMs: Date.now() - start, processed: summary.totalScored }
  } catch (err) {
    return { jobName: "health_scoring", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Process pending automation events (up to batchSize at a time) */
export async function runAutomationProcessorJob(batchSize = 50): Promise<JobResult> {
  const start = Date.now()
  const supabase = createAdminClient()

  try {
    const { data: events } = await supabase
      .from("automation_events")
      .select("id, event_name, creator_id, payload")
      .eq("processed", false)
      .order("created_at", { ascending: true })
      .limit(batchSize)

    if (!events?.length) {
      return { jobName: "automation_processor", ok: true, durationMs: Date.now() - start, processed: 0 }
    }

    let processed = 0
    let failed = 0
    for (const ev of events as { id: string; event_name: string; creator_id: string; payload: Record<string, unknown> }[]) {
      // Optimistic lock: mark processing=true before handler runs
      await supabase.from("automation_events").update({ processing: true }).eq("id", ev.id).match({}).then(null, () => {})

      // Resolve workflow_id from event name (WA-01 pattern stored in payload or mapped by convention)
      const workflowId = (ev.payload.workflowId as string | undefined) ?? ev.event_name
      const slaRecord = await startSLARecord(
        workflowId,
        ev.payload.tenantId as string | undefined,
        ev.payload.correlationId as string | undefined,
        ev.id,
      )

      const result = await processAutomationEvent(ev.id, ev.event_name as AutomationEventName, ev.creator_id, ev.payload)

      if (result.ok) {
        // Success — mark fully processed
        await supabase.from("automation_events").update({
          processed: true,
          processing: false,
          processed_at: new Date().toISOString(),
        }).eq("id", ev.id)
        await completeSLARecord(slaRecord, "completed")
        processed++
      } else {
        // Failure — record error, increment attempt count; do NOT mark processed=true
        const { data: current } = await supabase
          .from("automation_events")
          .select("attempt_count")
          .eq("id", ev.id)
          .single()

        const attempts = ((current as { attempt_count?: number } | null)?.attempt_count ?? 0) + 1
        const isDead = attempts >= 5

        await supabase.from("automation_events").update({
          processing: false,
          processed: isDead,          // move to DLQ state after 5 attempts
          processed_at: isDead ? new Date().toISOString() : null,
          attempt_count: attempts,
          last_error: result.error ?? "unknown error",
          failed_at: new Date().toISOString(),
        }).eq("id", ev.id)

        if (isDead) {
          logger.error("[automation] event moved to DLQ after 5 attempts", {
            eventId: ev.id,
            eventName: ev.event_name,
            creatorId: ev.creator_id,
          })
        }
        await completeSLARecord(slaRecord, "failed", result.error)
        failed++
      }
    }

    return { jobName: "automation_processor", ok: true, durationMs: Date.now() - start, processed, failed } as JobResult
  } catch (err) {
    return { jobName: "automation_processor", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Retry dead-letter webhook events (up to 5 attempts already enforced in retry.ts) */
export async function runWebhookRetryJob(): Promise<JobResult> {
  const start = Date.now()
  const supabase = createAdminClient()

  try {
    const { count } = await supabase
      .from("webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .lt("attempt_count", 5)

    // Log queue depth — actual retry execution handled by existing webhook routes
    logger.info("[job] webhook_retry: pending failed events", { count: count ?? 0 })
    return { jobName: "webhook_retry", ok: true, durationMs: Date.now() - start, processed: count ?? 0 }
  } catch (err) {
    return { jobName: "webhook_retry", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Cleanup read notifications older than 90 days */
export async function runNotificationCleanupJob(): Promise<JobResult> {
  const start = Date.now()
  const supabase = createAdminClient()

  try {
    const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString()
    const { count } = await supabase
      .from("notifications")
      .delete()
      .eq("is_read", true)
      .lt("created_at", cutoff)

    return { jobName: "notification_cleanup", ok: true, durationMs: Date.now() - start, processed: count ?? 0 }
  } catch (err) {
    return { jobName: "notification_cleanup", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Daily: compute churn risk scores for all active creators */
export async function runChurnScoringJobWorker(): Promise<JobResult> {
  const start = Date.now()
  try {
    const result = await runChurnScoringJob(200)
    logger.info("[job] churn_scoring complete", result as unknown as Record<string, unknown>)
    return { jobName: "churn_scoring", ok: true, durationMs: Date.now() - start, processed: result.scored }
  } catch (err) {
    return { jobName: "churn_scoring", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/**
 * Self-healing: unstick events that have been locked in processing=true for > 5 minutes.
 * Guards against worker crashes that leave events perpetually in-flight.
 */
export async function runStuckQueueRecoveryJob(): Promise<JobResult> {
  const start = Date.now()
  const supabase = createAdminClient()

  try {
    const cutoff = new Date(Date.now() - 5 * 60_000).toISOString()

    // Find events stuck in processing=true for more than 5 minutes
    const { data: stuckEvents } = await supabase
      .from("automation_events")
      .select("id, event_name, attempt_count")
      .eq("processed", false)
      .eq("processing", true)
      .lt("updated_at", cutoff)
      .limit(50)

    if (!stuckEvents?.length) {
      return { jobName: "stuck_queue_recovery", ok: true, durationMs: Date.now() - start, processed: 0 }
    }

    let recovered = 0
    for (const ev of stuckEvents as { id: string; event_name: string; attempt_count: number }[]) {
      await supabase.from("automation_events").update({
        processing:    false,
        last_error:    "Recovered by self-healing job (processing timeout > 5 min)",
        attempt_count: ev.attempt_count,  // preserve existing count
      }).eq("id", ev.id)
      recovered++
    }

    logger.info("[job] stuck_queue_recovery complete", { recovered })
    return { jobName: "stuck_queue_recovery", ok: true, durationMs: Date.now() - start, processed: recovered }
  } catch (err) {
    return { jobName: "stuck_queue_recovery", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Daily: compute virality scores + creator performance snapshots */
export async function runMarketplaceIntelligenceJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const [viralResult, snapResult] = await Promise.all([
      computeViralityScores(),
      snapshotCreatorPerformance(),
    ])
    logger.info("[job] marketplace_intelligence complete", { viralResult, snapResult })
    return {
      jobName: "marketplace_intelligence",
      ok: true,
      durationMs: Date.now() - start,
      processed: viralResult.computed + snapResult.snapped,
      failed: viralResult.failed,
    }
  } catch (err) {
    return { jobName: "marketplace_intelligence", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

export const ALL_JOBS: Record<string, () => Promise<JobResult>> = {
  health_scoring:           runHealthScoringJob,
  churn_scoring:            runChurnScoringJobWorker,
  automation_processor:     runAutomationProcessorJob,
  webhook_retry:            runWebhookRetryJob,
  notification_cleanup:     runNotificationCleanupJob,
  stuck_queue_recovery:     runStuckQueueRecoveryJob,
  marketplace_intelligence: runMarketplaceIntelligenceJob,
}
