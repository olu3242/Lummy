export interface GovernanceStabilitySnapshot {
  totalGovernanceEvents24h: number
  criticalCount: number
  highCount: number
  governanceStabilityScore: number
  primaryRisk: string
  snapshotDate: string
}

export interface StabilityGovRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
}
