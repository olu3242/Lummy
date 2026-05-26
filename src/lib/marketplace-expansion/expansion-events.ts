/**
 * Marketplace Expansion Intelligence typed event payloads.
 * All payloads flow through: emitEvent → automation_events → handlers.ts
 */

export interface CategoryHighGrowthPayload {
  category: string
  growthRate: number            // month-over-month
  totalCreators: number
  totalRevenue30dKobo: number
  opportunityScore: number      // 0-100
  snapshotDate: string
}

export interface EcosystemExpansionOpportunityPayload {
  opportunityType: "creator_acquisition" | "category_gap" | "geographic_gap" | "monetization_gap"
  title: string
  estimatedRevenueImpactKobo: number
  confidence: "low" | "medium" | "high"
  actionableCreators: string[]  // creator IDs to target
  snapshotDate: string
}

export interface GeographyExpansionOpportunityPayload {
  region: string                // e.g. "Lagos", "Abuja", "Port Harcourt"
  creatorCount: number
  marketSize: "small" | "medium" | "large"
  growthSignal: "emerging" | "growing" | "mature"
  underservedNiches: string[]
  snapshotDate: string
}

export interface CreatorNetworkScalingPayload {
  networkSize: number           // total active creators in network
  growthRate7d: number          // week-over-week growth
  topReferrers: string[]        // creator IDs driving most referrals
  networkDensity: number        // 0-1 (edges / potential edges)
  snapshotDate: string
}

export interface EcosystemNetworkAccelerationPayload {
  activeNodes: number           // creators with ≥1 referral
  newConnections7d: number
  accelerationSignal: "viral" | "growing" | "stable"
  snapshotDate: string
}

export interface EcosystemMonetizationOpportunityPayload {
  opportunityType: "cross_sell" | "upsell" | "bundle" | "referral_incentive"
  affectedCreators: number
  estimatedRevenueKobo: number
  confidence: "low" | "medium" | "high"
  snapshotDate: string
}

export interface CreatorReferralOpportunityPayload {
  creatorId: string
  referralPotential: "low" | "medium" | "high"
  estimatedReferrals: number
  incentiveRecommendation: string
  snapshotDate: string
}

export interface ExpansionIntelligenceRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
}
