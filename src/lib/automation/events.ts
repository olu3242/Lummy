// Automation event taxonomy — aligns with funnel events but automation-specific
export type AutomationEventName =
  | "order_created"
  | "payment_received"
  | "storefront_published"
  | "product_created"
  | "first_sale_completed"
  | "onboarding_completed"
  | "creator_inactive_7d"
  | "creator_inactive_30d"
  | "ai_generation_completed"
  | "storefront_unpublished"
  | "low_product_count"
  | "whatsapp_message_received"
  | "store_schema_updated"
  | "weekly_digest_requested"

export interface AutomationEvent {
  name: AutomationEventName
  creatorId: string
  payload: Record<string, unknown>
  idempotencyKey?: string
}
