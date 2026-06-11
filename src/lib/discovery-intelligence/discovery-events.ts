/**
 * Discovery Intelligence typed event payloads.
 * All payloads flow through: emitEvent → automation_events → handlers.ts
 */

export interface CreatorTrendingPayload {
  creatorId: string
  handle: string
  trendScore: number
  trendDriver: "views_spike" | "wa_surge" | "sales_acceleration" | "engagement_burst"
  views7d: number
  waClicks7d: number
  snapshotDate: string
}

export interface CreatorDiscoveryBoostPayload {
  creatorId: string
  reason: "underexposed_high_quality" | "new_products" | "engagement_recovery" | "niche_leader"
  qualityScore: number
  estimatedReachBoost: number   // % additional reach if boosted
  snapshotDate: string
}

export interface StorefrontDiscoveryAcceleratedPayload {
  creatorId: string
  storefrontHandle: string
  visibilityScore: number       // 0-100
  conversionPotential: number   // estimated ₦ revenue if discovery improved
  snapshotDate: string
}

export interface StorefrontRecommendationGeneratedPayload {
  creatorId: string
  customerId?: string
  recommendationType: "similar_niche" | "trending" | "high_converting" | "personalized"
  confidence: "low" | "medium" | "high"
  snapshotDate: string
}

export interface CustomerMatchHighConfidencePayload {
  customerId?: string
  creatorId: string
  matchScore: number            // 0-100
  matchSignals: string[]
  estimatedConversionLift: number  // % lift over random
  snapshotDate: string
}

export interface CustomerDiscoveryAcceleratedPayload {
  creatorId: string
  discoveryType: "intent_matched" | "affinity_scored" | "referral_chain"
  customersMatched: number
  snapshotDate: string
}

export interface CustomerReferralDetectedPayload {
  referrerId?: string
  creatorId: string
  referralCount: number
  estimatedRevenueLiftKobo: number
  snapshotDate: string
}

export interface CustomerLoyaltyAcceleratedPayload {
  creatorId: string
  loyalCustomers: number
  avgRepeatRate: number         // 0-1
  loyaltyScore: number          // 0-100
  snapshotDate: string
}

export interface ConversionPriorityHighPayload {
  creatorId: string
  priority: "checkout_recovery" | "high_intent_customer" | "trending_moment"
  estimatedRevenueKobo: number
  windowMinutes: number         // action window before opportunity expires
  snapshotDate: string
}

export interface DiscoveryIntelligenceRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
  creatorsScored?: number
}
