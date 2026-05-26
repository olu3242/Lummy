export type InterventionCategory =
  | "creator" | "monetization" | "retention"
  | "governance" | "scaling" | "operational"

export type InterventionUrgency = "critical" | "high" | "medium" | "low"

export interface InterventionRecord {
  id: string
  category: InterventionCategory
  eventName: string
  creatorId?: string
  urgency: InterventionUrgency
  priorityScore: number
  rawScore: number
  title: string
  signal: string
  recommendedAction: string
  detectedAt: string
  snapshotDate: string
}

export interface InterventionSystemRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
  interventionsRanked?: number
}
