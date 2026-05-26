/**
 * Trust Intelligence typed event payloads.
 * All payloads flow through: emitEvent → automation_events → handlers.ts
 */

export interface CreatorTrustScore {
  creatorId: string
  trustScore: number          // 0-100
  tier: "verified" | "trusted" | "standard" | "at_risk"
  components: {
    fulfillmentRate: number   // 0-100
    responseConsistency: number
    paymentReliability: number
    disputeFrequency: number  // inverted — higher = fewer disputes
    tenureBonus: number       // 0-20
  }
  signals: string[]
}

export interface CreatorTrustImprovedPayload {
  creatorId: string
  previousScore: number
  newScore: number
  improvement: number
  triggerSignal: string
  snapshotDate: string
}

export interface CreatorTrustDegradedPayload {
  creatorId: string
  previousScore: number
  newScore: number
  degradation: number
  primaryReason: string
  snapshotDate: string
}

export interface CreatorDisputeRiskPayload {
  creatorId: string
  disputeCount30d: number
  disputeRate: number          // disputes / orders
  riskLevel: "low" | "medium" | "high" | "critical"
  snapshotDate: string
}

export interface CreatorFulfillmentRiskPayload {
  creatorId: string
  fulfillmentRate: number      // 0-1
  pendingOrders: number
  overdueOrders: number
  snapshotDate: string
}

export interface CustomerTrustRiskPayload {
  customerId: string
  creatorId: string
  riskSignals: string[]
  riskScore: number            // 0-100
  snapshotDate: string
}

export interface CustomerFraudRiskPayload {
  customerId?: string
  creatorId: string
  paymentId?: string
  fraudSignals: string[]
  riskScore: number
  recommendedAction: "monitor" | "flag" | "block"
  snapshotDate: string
}

export interface SuspiciousCheckoutPayload {
  checkoutId?: string
  creatorId: string
  signals: string[]
  anomalyType: "velocity" | "amount" | "pattern" | "device"
  snapshotDate: string
}

export interface DisputeSpikePayload {
  creatorId?: string            // null = platform-wide spike
  disputeCount7d: number
  disputeCountPrior7d: number
  spikePercent: number
  snapshotDate: string
}

export interface MarketplaceIntegrityRiskPayload {
  overallIntegrityScore: number // 0-100
  highRiskCreators: number
  disputeRate: number
  fraudSignals: string[]
  snapshotDate: string
}

export interface MarketplaceTrustDegradationPayload {
  previousScore: number
  currentScore: number
  degradation: number
  primaryReason: string
  snapshotDate: string
}

export interface TrustIntelligenceRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
  creatorsScored?: number
}
