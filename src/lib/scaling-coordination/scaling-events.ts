/**
 * Scaling Coordination typed event payloads.
 * All payloads flow through: emitEvent → automation_events → handlers.ts
 */

export interface MarketplaceScalingBottleneckPayload {
  bottleneckType: "onboarding_drop" | "payment_failures" | "processing_lag" | "creator_acquisition" | "conversion_gap"
  severity: "low" | "medium" | "high" | "critical"
  affectedCreators?: number
  estimatedRevenueLossKobo?: number
  recommendedAction: string
  snapshotDate: string
}

export interface CreatorAcquisitionOpportunityPayload {
  opportunityType: "referral_program" | "niche_gap" | "geographic_gap" | "category_expansion"
  targetNiche?: string
  targetRegion?: string
  estimatedCreatorCount: number
  estimatedRevenueLiftKobo: number
  confidence: "low" | "medium" | "high"
  snapshotDate: string
}

export interface MonetizationAnomalyPayload {
  anomalyType: "sudden_revenue_spike" | "sudden_revenue_drop" | "abnormal_refund_rate" | "price_manipulation" | "volume_anomaly"
  creatorId?: string            // null = platform-wide anomaly
  magnitude: number             // deviation from expected (e.g. 3× normal)
  expectedValue: number
  observedValue: number
  snapshotDate: string
}

export interface EcosystemIntegrityRiskPayload {
  riskType: "widespread_fraud" | "trust_collapse" | "dispute_epidemic" | "churn_cascade"
  severity: "medium" | "high" | "critical"
  affectedCreators: number
  affectedCustomers?: number
  riskScore: number             // 0-100
  snapshotDate: string
}

export interface LocalizedMonetizationOpportunityPayload {
  region: string
  niche: string
  opportunityScore: number      // 0-100
  activeCreators: number
  revenueGrowthRate: number
  underservedSignals: string[]
  snapshotDate: string
}

export interface RegionHighGrowthPayload {
  region: string
  growthRate: number
  creatorCount: number
  revenueKobo: number
  snapshotDate: string
}

export interface DiscoveryOptimizationRecommendedPayload {
  recommendationType: "boost_underexposed" | "fix_conversion_gap" | "improve_cta" | "expand_catalog"
  affectedCreators: number
  estimatedReachBoost: number   // % increase in discovery
  priorityScore: number         // 0-100
  snapshotDate: string
}

export interface ScalingGovernanceAlertPayload {
  governanceArea: "cron_overload" | "event_queue_depth" | "sla_breach" | "memory_limit" | "api_rate_limit"
  currentValue: number
  thresholdValue: number
  severity: "warning" | "critical"
  recommendedAction: string
  snapshotDate: string
}

export interface ScalingCoordinationRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
}
