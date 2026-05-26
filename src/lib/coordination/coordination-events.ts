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
  { eventName: "ai_cost_spike",              basePriority: 3, rationale: "Cost alert needs prompt review" },
  { eventName: "workflow_retry_spike",       basePriority: 3, rationale: "Runtime health signal" },
  // Trust intelligence — critical/high risk escalated
  { eventName: "customer_fraud_risk",        basePriority: 2, rationale: "Fraud requires fast action" },
  { eventName: "suspicious_checkout_detected", basePriority: 2, rationale: "Checkout anomaly — short window" },
  { eventName: "dispute_spike_detected",     basePriority: 2, rationale: "Dispute spike platform risk" },
  { eventName: "marketplace_integrity_risk", basePriority: 2, rationale: "Platform integrity alert" },
  { eventName: "creator_trust_degraded",     basePriority: 3, rationale: "Trust degradation intervention" },
  { eventName: "creator_dispute_risk",       basePriority: 3, rationale: "Dispute risk creator alert" },
  { eventName: "creator_fulfillment_risk",   basePriority: 3, rationale: "Fulfillment risk ops alert" },
  { eventName: "marketplace_trust_degradation", basePriority: 3, rationale: "Platform trust alert" },
  { eventName: "conversion_priority_high",   basePriority: 2, rationale: "High-intent conversion window" },
  // Discovery — time-sensitive trending signals
  { eventName: "creator_trending",           basePriority: 4, rationale: "Trending moment is fleeting" },
  { eventName: "creator_trust_improved",     basePriority: 6, rationale: "Trust improvement notify" },
  { eventName: "creator_high_reliability",   basePriority: 7, rationale: "Reliability recognition" },
  // Expansion — background intelligence
  { eventName: "category_high_growth",       basePriority: 8, rationale: "Category intelligence signal" },
  { eventName: "geography_expansion_opportunity", basePriority: 9, rationale: "Geographic expansion planning" },
  { eventName: "ecosystem_expansion_opportunity", basePriority: 8, rationale: "Expansion ops signal" },
  { eventName: "ecosystem_network_acceleration",  basePriority: 8, rationale: "Network growth tracking" },
  { eventName: "creator_network_scaling",    basePriority: 9, rationale: "Network scaling informational" },
  // Economy intelligence — growth alerts are time-sensitive, forecasts informational
  { eventName: "creator_high_growth",           basePriority: 4, rationale: "Growth moment is fleeting" },
  { eventName: "creator_revenue_accelerated",   basePriority: 4, rationale: "Revenue acceleration to amplify" },
  { eventName: "creator_profitability_growth",  basePriority: 5, rationale: "AOV growth advisory" },
  { eventName: "creator_scaling_opportunity",   basePriority: 5, rationale: "Scaling advisory" },
  { eventName: "repeat_purchase_accelerated",   basePriority: 5, rationale: "Retention growth signal" },
  { eventName: "economy_health_updated",        basePriority: 9, rationale: "Platform informational" },
  { eventName: "creator_ecosystem_influence_growth", basePriority: 7, rationale: "Ecosystem informational" },
  // Retention intelligence — churn requires fast action; loyalty is advisory
  { eventName: "creator_retention_risk",             basePriority: 3, rationale: "Retention intervention window" },
  { eventName: "customer_churn_risk",                basePriority: 3, rationale: "Churn recovery window" },
  { eventName: "customer_retention_recovery_needed", basePriority: 3, rationale: "Recovery action needed" },
  { eventName: "customer_repeat_purchase_growth",    basePriority: 6, rationale: "Retention growth signal" },
  { eventName: "customer_community_growth",          basePriority: 7, rationale: "Community informational" },
  { eventName: "loyalty_acceleration",               basePriority: 6, rationale: "Loyalty milestone" },
  { eventName: "engagement_decay",                   basePriority: 4, rationale: "Decay needs prompt action" },
  // Scaling coordination — governance and bottlenecks are high priority
  { eventName: "scaling_governance_alert",           basePriority: 2, rationale: "System health alert" },
  { eventName: "marketplace_scaling_bottleneck",     basePriority: 3, rationale: "Scaling blocker" },
  { eventName: "ecosystem_integrity_risk",           basePriority: 3, rationale: "Ecosystem risk" },
  { eventName: "monetization_anomaly",               basePriority: 3, rationale: "Revenue anomaly" },
  { eventName: "creator_acquisition_opportunity",    basePriority: 8, rationale: "Growth planning signal" },
  { eventName: "localized_monetization_opportunity", basePriority: 8, rationale: "Ops planning signal" },
  { eventName: "region_high_growth",                 basePriority: 8, rationale: "Geographic intelligence" },
  { eventName: "discovery_optimization_recommended", basePriority: 7, rationale: "Discovery advisory" },
  // Kernel intelligence — interventions are high priority by design
  { eventName: "intervention_priority_high",         basePriority: 2, rationale: "Kernel ranked critical intervention" },
  { eventName: "monetization_intervention_required", basePriority: 2, rationale: "Monetization risk intervention" },
  { eventName: "retention_intervention_required",    basePriority: 2, rationale: "Retention risk intervention" },
  { eventName: "governance_intervention_required",   basePriority: 2, rationale: "Governance risk intervention" },
  { eventName: "scaling_intervention_required",      basePriority: 3, rationale: "Scaling bottleneck intervention" },
  { eventName: "operational_intervention_required",  basePriority: 2, rationale: "Runtime health intervention" },
  // Governance kernel — degradation signals need prompt review
  { eventName: "marketplace_governance_risk",        basePriority: 3, rationale: "Marketplace governance degradation" },
  { eventName: "marketplace_sustainability_risk",    basePriority: 3, rationale: "Sustainability risk alert" },
  { eventName: "trust_governance_degraded",          basePriority: 3, rationale: "Trust governance degradation" },
  { eventName: "monetization_governance_alert",      basePriority: 3, rationale: "Monetization governance alert" },
  // Revenue stability — revenue interruption needs fast action
  { eventName: "creator_revenue_risk",               basePriority: 3, rationale: "Revenue risk requires action" },
  { eventName: "monetization_interruption_detected", basePriority: 2, rationale: "Revenue interrupted — urgent" },
  { eventName: "payout_degradation_detected",        basePriority: 2, rationale: "Payment failures — urgent" },
  { eventName: "creator_revenue_stabilized",         basePriority: 7, rationale: "Recovery confirmation" },
  { eventName: "ecosystem_revenue_stabilized",       basePriority: 8, rationale: "Ecosystem recovery informational" },
  // Recovery kernel — recovery triggers are medium-high priority
  { eventName: "creator_recovery_required",          basePriority: 3, rationale: "Creator reactivation needed" },
  { eventName: "customer_recovery_required",         basePriority: 3, rationale: "Customer re-engagement needed" },
  { eventName: "engagement_recovery_required",       basePriority: 4, rationale: "Engagement recovery" },
  { eventName: "storefront_recovery_required",       basePriority: 4, rationale: "Storefront refresh needed" },
  { eventName: "lifecycle_recovery_required",        basePriority: 4, rationale: "Lifecycle recovery" },
  // Scaling kernel — capacity and bottleneck signals
  { eventName: "scaling_bottleneck_detected",        basePriority: 3, rationale: "Scaling bottleneck detected" },
  { eventName: "marketplace_capacity_risk",          basePriority: 3, rationale: "Capacity pressure alert" },
  { eventName: "creator_density_high_growth",        basePriority: 8, rationale: "Density growth informational" },
  { eventName: "category_saturation_detected",       basePriority: 7, rationale: "Category saturation signal" },
  { eventName: "scaling_coordination_required",      basePriority: 3, rationale: "Cross-module scaling coordination" },
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
