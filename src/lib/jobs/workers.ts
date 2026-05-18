import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { recomputeAllHealthScores } from "@/lib/growth/health"
import { processAutomationEvent } from "@/lib/automation/handlers"
import { runChurnScoringJob } from "@/lib/creator/churn"
import type { AutomationEventName } from "@/lib/automation/events"

export interface JobResult {
  jobName: string
  ok: boolean
  durationMs: number
  processed?: number
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
    for (const ev of events as { id: string; event_name: string; creator_id: string; payload: Record<string, unknown> }[]) {
      const result = await processAutomationEvent(ev.id, ev.event_name as AutomationEventName, ev.creator_id, ev.payload)
      // Mark processed regardless of handler success (prevents infinite retry on bad data)
      await supabase.from("automation_events").update({
        processed: true,
        processed_at: new Date().toISOString(),
      }).eq("id", ev.id)
      if (result.ok) processed++
    }

    return { jobName: "automation_processor", ok: true, durationMs: Date.now() - start, processed }
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

export const ALL_JOBS: Record<string, () => Promise<JobResult>> = {
  health_scoring:        runHealthScoringJob,
  churn_scoring:         runChurnScoringJobWorker,
  automation_processor:  runAutomationProcessorJob,
  webhook_retry:         runWebhookRetryJob,
  notification_cleanup:  runNotificationCleanupJob,
}
