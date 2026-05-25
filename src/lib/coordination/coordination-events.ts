/**
 * Coordination event payload types.
 * All coordination signals route through automation_events → handlers.ts.
 */

export type WorkflowPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface PriorityRule {
  eventName: string
  basePriority: WorkflowPriority
  rationale: string
}

// Static priority rules — lower number = higher priority
export const PRIORITY_RULES: PriorityRule[] = [
  { eventName: "payment_received",      basePriority: 1, rationale: "Revenue events are highest priority" },
  { eventName: "payment_failed",        basePriority: 1, rationale: "Payment failures need immediate attention" },
  { eventName: "order_created",         basePriority: 2, rationale: "Order fulfillment SLA" },
  { eventName: "checkout_abandoned",    basePriority: 2, rationale: "Recovery window is short" },
  { eventName: "onboarding_completed",  basePriority: 2, rationale: "First impression matters" },
  { eventName: "customer_high_value",   basePriority: 2, rationale: "VIP customer acceleration" },
  { eventName: "creator_churn_risk",    basePriority: 3, rationale: "Retention intervention" },
  { eventName: "creator_health_degraded", basePriority: 3, rationale: "Creator recovery" },
  { eventName: "storefront_published",  basePriority: 3, rationale: "Launch moment" },
  { eventName: "product_created",       basePriority: 4, rationale: "Growth milestone" },
  { eventName: "lead_scored",           basePriority: 4, rationale: "Lead qualification" },
  { eventName: "creator_revenue_drop",  basePriority: 4, rationale: "Revenue recovery" },
  { eventName: "recommendation_generated", basePriority: 6, rationale: "Advisory — not time-critical" },
  { eventName: "creator_revenue_forecast_updated", basePriority: 7, rationale: "Informational" },
  { eventName: "marketplace_health_updated", basePriority: 8, rationale: "Background intelligence" },
  { eventName: "ecosystem_revenue_growth",   basePriority: 9, rationale: "Informational platform signal" },
  { eventName: "ai_cost_spike",         basePriority: 3, rationale: "Cost alert needs prompt review" },
  { eventName: "workflow_retry_spike",  basePriority: 3, rationale: "Runtime health signal" },
]

export const PRIORITY_MAP = new Map<string, WorkflowPriority>(
  PRIORITY_RULES.map(r => [r.eventName, r.basePriority])
)

export function getPriority(eventName: string): WorkflowPriority {
  return PRIORITY_MAP.get(eventName) ?? 5
}

export interface MonetizationOpportunity {
  creatorId: string
  type: "high_traffic_low_conversion" | "abandoned_cart_spike" | "underpriced_products" | "inactive_products" | "repeat_customer_gap"
  title: string
  estimatedRevenueKobo: number
  confidence: "low" | "medium" | "high"
}
