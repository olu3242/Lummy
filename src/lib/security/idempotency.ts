import crypto from "crypto"

/**
 * Build a stable idempotency key from source + external reference.
 * Stored in transactions.idempotency_key to prevent duplicate processing.
 */
export function buildIdempotencyKey(source: string, reference: string): string {
  return `${source}:${reference}`
}

/**
 * Hash a raw webhook payload for replay/duplicate detection.
 * Stored in webhook_events.event_hash.
 */
export function hashPayload(payload: string): string {
  return crypto.createHash("sha256").update(payload).digest("hex")
}

/**
 * Check if a webhook event hash already exists in webhook_events.
 * Returns true if it's a duplicate (should be skipped).
 */
export async function isDuplicateWebhook(
  eventHash: string,
  supabase: { from: (table: string) => unknown },
): Promise<boolean> {
  const { data } = await (supabase
    .from("webhook_events") as {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          not: (col2: string, op: string, val2: string) => {
            maybeSingle: () => Promise<{ data: unknown }>
          }
        }
      }
    })
    .select("id")
    .eq("event_hash", eventHash)
    .not("status", "eq", "dead")
    .maybeSingle()

  return data !== null
}

/**
 * Sanitize a filename: strip path traversal, preserve extension, lowercase.
 */
export function sanitizeFilename(original: string): string {
  const base = original.replace(/^.*[\\/]/, "")  // strip any path component
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase()
  return safe.slice(0, 128) || "upload"
}
