/**
 * Ecosystem intelligence typed event payloads.
 * All payloads flow through: emitEvent → automation_events → handlers.ts
 */

export interface EcosystemRevenueGrowthPayload {
  totalRevenue30dKobo: number
  totalRevenuePrior30dKobo: number
  growthRate: number              // e.g. 0.15 = 15% growth
  activeCreators: number
  newCreators: number
  topGrowthCreators: string[]
  snapshotDate: string
}

export interface EcosystemRetentionRiskPayload {
  platformRetentionRate: number   // % of creators still active month-over-month
  avgRepeatCustomerRate: number
  churnRiskCreatorCount: number
  criticalThreshold: boolean      // true if retention < 60%
  snapshotDate: string
}

export interface EcosystemHealthReport {
  overallScore: number            // 0-100
  revenueScore: number            // 0-25
  growthScore: number             // 0-25
  retentionScore: number          // 0-25
  conversionScore: number         // 0-25
  signals: string[]
  snapshotDate: string
}

export interface EcosystemIntelligenceRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
}
