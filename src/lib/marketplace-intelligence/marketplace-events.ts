/**
 * Marketplace intelligence typed event payloads.
 * All payloads flow through: emitEvent → automation_events → handlers.ts
 */

export interface MarketplaceHealthUpdatedPayload {
  overallScore: number          // 0-100
  activeCreators: number
  totalRevenue30dKobo: number
  avgConversionRate: number     // WA clicks / views
  topPerformingCategories: string[]
  riskSignals: string[]
  snapshotDate: string
}

export interface MarketplaceConversionDropPayload {
  previousRate: number          // e.g. 0.08 (8%)
  currentRate: number           // e.g. 0.04 (4%)
  dropPercent: number           // e.g. 50 (50% drop)
  affectedCreators: number
  period: "7d" | "14d" | "30d"
  snapshotDate: string
}

export interface StorefrontPerformanceRiskPayload {
  creatorId: string
  riskType: "low_conversion" | "no_products" | "inactive" | "high_bounce"
  riskScore: number             // 0-100, higher = more at risk
  metric: string                // human-readable: "2% WhatsApp conversion (market avg: 8%)"
  snapshotDate: string
}

export interface CreatorRankingUpdatedPayload {
  creatorId: string
  rank: number
  percentile: number            // 0-100
  tier: "standard" | "growing" | "influential" | "top"
  compositeScore: number        // 0-100
  snapshotDate: string
}

export interface MarketplaceIntelligenceRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
  creatorsScored?: number
}
