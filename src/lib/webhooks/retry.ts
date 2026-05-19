import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"

export type WebhookSource = "paystack" | "whatsapp" | "flutterwave"
export type WebhookStatus = "pending" | "processed" | "failed" | "dead"

const MAX_ATTEMPTS = 5

export interface WebhookEventRecord {
  id: string
  source: WebhookSource
  event_type: string
  correlation_id: string | null
  payload: Record<string, unknown>
  status: WebhookStatus
  attempt_count: number
  error_message: string | null
  created_at: string
}

export async function recordWebhookReceived(
  source: WebhookSource,
  eventType: string,
  payload: Record<string, unknown>,
  correlationId?: string,
  eventHash?: string,
): Promise<string | null> {
  try {
    const supabase = createAdminClient()

    // Duplicate detection: if this hash already exists and was processed, skip
    if (eventHash) {
      const { data: existing } = await supabase
        .from("webhook_events")
        .select("id, status")
        .eq("event_hash", eventHash)
        .maybeSingle()

      if (existing) {
        logger.info("[webhooks/retry] duplicate webhook detected", { eventHash, existingId: existing.id })
        return null // caller should return 200 without reprocessing
      }
    }

    const { data, error } = await supabase
      .from("webhook_events")
      .insert({
        source,
        event_type: eventType,
        correlation_id: correlationId ?? null,
        event_hash: eventHash ?? null,
        payload,
        status: "pending",
        attempt_count: 1,
        last_attempted_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      logger.warn("[webhooks/retry] insert failed", { error: error.message })
      return null
    }
    return data?.id ?? null
  } catch (err) {
    logger.error("[webhooks/retry] recordWebhookReceived threw", { error: String(err) })
    return null
  }
}

export async function markWebhookProcessed(id: string): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", id)
  } catch { /* best-effort */ }
}

export async function markWebhookFailed(id: string, errorMessage: string): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Fetch current attempt count
    const { data } = await supabase
      .from("webhook_events")
      .select("attempt_count")
      .eq("id", id)
      .single()

    const attempts = (data?.attempt_count ?? 1) + 1
    const status: WebhookStatus = attempts >= MAX_ATTEMPTS ? "dead" : "failed"

    await supabase
      .from("webhook_events")
      .update({
        status,
        attempt_count: attempts,
        error_message: errorMessage,
        last_attempted_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (status === "dead") {
      logger.error("[webhooks/retry] event moved to dead letter", { id, errorMessage, attempts })
    }
  } catch { /* best-effort */ }
}

export async function getPendingWebhooks(source: WebhookSource, limit = 50): Promise<WebhookEventRecord[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("webhook_events")
      .select("*")
      .eq("source", source)
      .in("status", ["pending", "failed"])
      .lt("attempt_count", MAX_ATTEMPTS)
      .order("created_at", { ascending: true })
      .limit(limit)

    return (data ?? []) as unknown as WebhookEventRecord[]
  } catch {
    return []
  }
}
