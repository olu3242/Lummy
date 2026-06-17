import { createAdminClient } from "@/lib/supabase/server"

export type SecurityEventType =
  | "failed_login"
  | "failed_signup"
  | "webhook_verification_failure"
  | "payment_signature_failure"
  | "tenant_access_denied"

export type SecurityEventSeverity = "low" | "medium" | "high" | "critical"

/**
 * security_events (migration 041) is service-role-write-only — this is the
 * single place that writes to it, called from the auth, webhook, and tenant
 * access-check paths that previously left it empty.
 */
export async function recordSecurityEvent(input: {
  eventType: SecurityEventType
  severity?: SecurityEventSeverity
  organizationId?: string | null
  userId?: string | null
  endpoint?: string | null
  details?: Record<string, unknown>
}): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from("security_events").insert({
      event_type: input.eventType,
      severity: input.severity ?? "medium",
      organization_id: input.organizationId ?? null,
      user_id: input.userId ?? null,
      endpoint: input.endpoint ?? null,
      details: input.details ?? {},
    })
  } catch (err) {
    console.error("[security_events] failed to record event", { eventType: input.eventType, error: String(err) })
  }
}
