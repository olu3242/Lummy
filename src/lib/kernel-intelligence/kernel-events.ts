export interface CreatorScoreBundle {
  creatorId: string
  healthScore: number
  growthScore: number
  riskScore: number
  retentionScore: number
  monetizationScore: number
  compositeScore: number
  computedAt: string
}

export interface MarketplaceScoreBundle {
  healthScore: number
  growthScore: number
  integrityScore: number
  conversionScore: number
  retentionScore: number
  compositeScore: number
  snapshotDate: string
}

export interface CustomerScoreBundle {
  creatorId: string
  engagementScore: number
  conversionScore: number
  loyaltyScore: number
  riskScore: number
  snapshotDate: string
}

export interface OperationalScoreBundle {
  runtimeHealthScore: number
  workflowHealthScore: number
  monetizationHealthScore: number
  slaHealthScore: number
  aiEfficiencyScore: number
  compositeScore: number
  snapshotDate: string
}

export interface InterventionItem {
  category: "creator" | "monetization" | "retention" | "scaling" | "governance" | "operational"
  creatorId?: string
  title: string
  urgency: "critical" | "high" | "medium"
  score: number
  signal: string
  recommendedAction: string
  snapshotDate: string
}

export interface MarketplaceStateSnapshot {
  creator: MarketplaceScoreBundle
  operational: OperationalScoreBundle
  topInterventions: InterventionItem[]
  signalCount: number
  suppressedCount: number
  snapshotDate: string
}

export interface KernelRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
  scoresComputed?: number
}
