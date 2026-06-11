/**
 * Workflow Priority Engine — assigns priority scores to pending automation_events
 * to ensure SLA-critical and high-value events are processed first.
 *
 * Runs before the main processor batch. Modifies the `priority` column on
 * pending events so the processor ORDER BY priority ASC, created_at ASC
 * picks up the most important events first.
 *
 * Priority scale: 1 (critical/SLA) → 10 (low/informational)
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { getPriority } from "./coordination-events"
import type { JobResult } from "@/lib/jobs/workers"

export async function runWorkflowPriorityEngine(): Promise<Pick<JobResult, "processed" | "durationMs">> {
  const start = Date.now()
  const supabase = createAdminClient()

  try {
    // Fetch pending events that have default priority (5) and haven't been re-prioritized
    const { data: pending } = await supabase
      .from("automation_events")
      .select("id, event_name, attempt_count, creator_id, payload")
      .in("status", ["pending", "retrying"])
      .eq("priority", 5)        // only touch events still at default
      .limit(500)

    if (!pending?.length) return { processed: 0, durationMs: Date.now() - start }

    let updated = 0
    const batchUpdates: { id: string; priority: number }[] = []

    for (const ev of pending as { id: string; event_name: string; attempt_count: number | null; creator_id: string; payload: Record<string, unknown> }[]) {
      let priority = getPriority(ev.event_name)

      // Escalate priority for retrying events — they've already waited
      if ((ev.attempt_count ?? 0) >= 2) priority = Math.max(1, priority - 2) as typeof priority

      // High-attempt events get urgency bump (potential DLQ approach)
      if ((ev.attempt_count ?? 0) >= 4) priority = 1

      if (priority !== 5) {
        batchUpdates.push({ id: ev.id, priority })
      }
    }

    // Apply updates in batches
    for (const update of batchUpdates) {
      await supabase
        .from("automation_events")
        .update({ priority: update.priority })
        .eq("id", update.id)
      updated++
    }

    logger.info("[priority-engine] re-prioritized events", { updated, total: pending.length })
    return { processed: updated, durationMs: Date.now() - start }
  } catch (err) {
    logger.error("[priority-engine] failed", { error: String(err) })
    return { processed: 0, durationMs: Date.now() - start }
  }
}
