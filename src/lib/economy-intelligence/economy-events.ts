/**
 * Economy Intelligence typed event payloads.
 * All payloads flow through: emitEvent → automation_events → handlers.ts
 */

export interface CreatorEconomyScore {
  creatorId: string
  economyScore: number          // 0-100
  revenueGrowthRate: number     // WoW or MoM
  avgOrderValue: number         // kobo
  repeatPurchaseRate: number    // 0-1
  orderVelocity: number         // orders per 7d
}

export interface CreatorHighGrowthPayload {
  creatorId: string
  growthRate: number            // e.g. 0.35 = 35% WoW
  period: "7d" | "30d"
  revenueKobo: number
  orderCount: number
  snapshotDate: string
}

export interface CreatorRevenueAcceleratedPayload {
  creatorId: string
  previousRevenueKobo: number
  currentRevenueKobo: number
  accelerationRate: number      // currentRevenue / previousRevenue - 1
  driverSignal: "repeat_buyers" | "new_traffic" | "higher_aov" | "volume_spike"
  snapshotDate: string
}

export interface CreatorProfitabilityGrowthPayload {
  creatorId: string
  currentAOV: number            // average order value in kobo
  previousAOV: number
  aovGrowthRate: number
  revenueEfficiencyScore: number // 0-100
  snapshotDate: string
}

export interface CreatorScalingOpportunityPayload {
  creatorId: string
  forecastRevenue30dKobo: number
  currentRevenue30dKobo: number
  scalingSignal: "trajectory_high" | "undermonetized" | "high_traffic_low_revenue"
  opportunityScore: number       // 0-100
  snapshotDate: string
}

export interface RepeatPurchaseAcceleratedPayload {
  creatorId: string
  repeatRateCurrent: number      // 0-1
  repeatRatePrior: number
  improvement: number            // percentage points
  loyalCustomerCount: number
  snapshotDate: string
}

export interface EconomyHealthUpdatedPayload {
  totalGMV30dKobo: number
  growthRate: number
  avgCreatorRevenue30dKobo: number
  activeCreators: number
  economyScore: number           // 0-100
  snapshotDate: string
}

export interface CreatorEcosystemInfluenceGrowthPayload {
  creatorId: string
  influenceScore: number
  influenceGrowthRate: number
  networkSize: number
  referralCount: number
  snapshotDate: string
}

export interface EconomyIntelligenceRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
  creatorsScored?: number
}
