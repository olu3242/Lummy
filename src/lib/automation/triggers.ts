import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import type { AutomationEvent } from "./events"

/**
 * Enqueue an automation event for async processing.
 * Idempotency key prevents duplicate triggers: if the same key already exists
 * for this creator, the insert is silently ignored (do nothing on conflict).
 */
export async function dispatchAutomation(event: AutomationEvent): Promise<void> {
  try {
    const supabase = createAdminClient()
    const row = {
      creator_id:      event.creatorId,
      event_name:      event.name,
      payload:         event.payload,
      idempotency_key: event.idempotencyKey ?? null,
      processed:       false,
    }
    if (event.idempotencyKey) {
      // Silently skip duplicate events — the unique constraint on
      // (creator_id/tenant_id, idempotency_key) prevents double-processing.
      await supabase.from("automation_events")
        .upsert(row, { onConflict: "idempotency_key", ignoreDuplicates: true })
    } else {
      await supabase.from("automation_events").insert(row)
    }
    logger.info("[automation] dispatched", { event: event.name, creatorId: event.creatorId })
  } catch (err) {
    // Best-effort — never block the main flow
    logger.warn("[automation] dispatch failed", { event: event.name, error: String(err) })
  }
}

/** Convenience: fire and forget without awaiting */
export function triggerAutomation(event: AutomationEvent): void {
  void dispatchAutomation(event).catch(() => {})
}
