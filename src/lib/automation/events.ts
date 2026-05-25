// Automation event taxonomy — aligns with funnel events but automation-specific
export type AutomationEventName =
  | "order_created"
  | "payment_received"
  | "payment_failed"
  | "payment_timeout"
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
  | "checkout_started"
  | "checkout_abandoned"
  | "lead_scored"
  // ── Intelligence events ──────────────────────────────────────────────
  | "creator_health_degraded"
  | "creator_revenue_drop"
  | "creator_revenue_forecast_updated"
  | "creator_growth_detected"
  | "creator_churn_risk"
  | "creator_engagement_drop"
  | "customer_high_value"
  | "customer_reengagement_needed"
  | "workflow_retry_spike"
  | "workflow_at_risk"
  | "ai_cost_spike"
  | "ai_budget_risk"
  | "recommendation_generated"

export interface AutomationEvent {
  name: AutomationEventName
  creatorId: string
  payload: Record<string, unknown>
  idempotencyKey?: string
}
