export interface ScalingStabilizationPayload {
  triggerEvent: string
  triggerCount: number
  severity: "warning" | "critical"
  recommendedAction: string
  snapshotDate: string
}

export interface ScalingStabRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
}
