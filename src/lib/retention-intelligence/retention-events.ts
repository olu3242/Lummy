/**
 * Retention Intelligence typed event payloads.
 * All payloads flow through: emitEvent → automation_events → handlers.ts
 */

export interface CreatorRetentionRiskPayload {
  creatorId: string
  riskLevel: "low" | "medium" | "high" | "critical"
  daysSinceLastOrder: number
  daysSinceLastActivity: number
  retentionScore: number        // 0-100 (100 = fully retained)
  primaryDecaySignal: string
  snapshotDate: string
}

export interface CustomerChurnRiskPayload {
  customerId?: string
  creatorId: string
  churnRiskScore: number        // 0-100
  daysSinceLastPurchase: number
  purchaseFrequency: number     // avg days between purchases
  churnProbability: number      // 0-1
  snapshotDate: string
}

export interface CustomerRetentionRecoveryNeededPayload {
  creatorId: string
  customersAtRisk: number
  avgDaysSilent: number
  estimatedRevenueLossKobo: number
  recommendedAction: "whatsapp_reach_out" | "discount_offer" | "new_product_alert"
  snapshotDate: string
}

export interface CustomerRepeatPurchaseGrowthPayload {
  creatorId: string
  repeatPurchaseRate: number
  repeatCustomerCount: number
  growthRate: number
  snapshotDate: string
}

export interface CustomerCommunityGrowthPayload {
  creatorId: string
  communitySize: number         // loyal + repeat customers
  growthRate7d: number
  engagementScore: number       // 0-100
  snapshotDate: string
}

export interface LoyaltyAccelerationPayload {
  creatorId: string
  loyaltyTier: "bronze" | "silver" | "gold" | "champion"
  loyalCustomers: number
  avgOrdersPerLoyalCustomer: number
  loyaltyScore: number          // 0-100
  snapshotDate: string
}

export interface EngagementDecayPayload {
  creatorId: string
  peakViews7d: number
  currentViews7d: number
  decayRate: number             // e.g. -0.4 = 40% drop
  decayStage: "early" | "moderate" | "severe"
  snapshotDate: string
}

export interface RetentionIntelligenceRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
  creatorsScored?: number
}
