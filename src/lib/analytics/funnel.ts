import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"

// Canonical funnel event names — extend as needed
export type FunnelEvent =
  | "signup_started"
  | "signup_completed"
  | "onboarding_started"
  | "onboarding_completed"
  | "storefront_published"
  | "first_product_created"
  | "first_sale_completed"
  | "whatsapp_cta_clicked"
  | "checkout_started"
  | "checkout_completed"
  | "ai_generation_used"
  | "profile_completed"
  | "product_published"
  | "store_schema_saved"
  | "notification_opened"

export interface FunnelEventOptions {
  creatorId?: string
  userId?: string
  sessionId?: string
  properties?: Record<string, unknown>
}

export async function trackFunnelEvent(
  event: FunnelEvent,
  options: FunnelEventOptions = {},
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from("funnel_events").insert({
      event_name: event,
      creator_id: options.creatorId ?? null,
      user_id: options.userId ?? null,
      session_id: options.sessionId ?? null,
      properties: options.properties ?? {},
    })
  } catch (err) {
    // Never throw — analytics must not break product flow
    logger.warn("[funnel] trackFunnelEvent failed", { event, error: String(err) })
  }
}

export interface FunnelMetrics {
  event: FunnelEvent
  count: number
  uniqueCreators: number
}

export async function getFunnelMetrics(since?: Date): Promise<FunnelMetrics[]> {
  try {
    const supabase = createAdminClient()
    const sinceDate = since ?? new Date(Date.now() - 30 * 86_400_000)

    const { data } = await supabase
      .from("funnel_events")
      .select("event_name, creator_id")
      .gte("created_at", sinceDate.toISOString())

    if (!data) return []

    const byEvent: Record<string, { count: number; creators: Set<string> }> = {}
    for (const row of data as { event_name: string; creator_id: string | null }[]) {
      if (!byEvent[row.event_name]) {
        byEvent[row.event_name] = { count: 0, creators: new Set() }
      }
      byEvent[row.event_name].count++
      if (row.creator_id) byEvent[row.event_name].creators.add(row.creator_id)
    }

    return Object.entries(byEvent).map(([event, v]) => ({
      event: event as FunnelEvent,
      count: v.count,
      uniqueCreators: v.creators.size,
    }))
  } catch {
    return []
  }
}
