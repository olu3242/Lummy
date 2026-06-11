/**
 * Intelligence event type definitions and payloads.
 * All intelligence signals emit as standard automation_events.
 */

export interface CreatorHealthDegradedPayload {
  creatorId: string
  previousScore: number
  currentScore: number
  dropPct: number
  riskLevel: string
  signals: string[]
  correlationId?: string
}

export interface CreatorRevenueDrop {
  creatorId: string
  currentRevenueKobo: number
  previousRevenueKobo: number
  dropPct: number
  windowDays: number
  correlationId?: string
}

export interface CreatorGrowthDetected {
  creatorId: string
  growthPct: number
  currentRevenueKobo: number
  windowDays: number
  trigger: "revenue" | "orders" | "engagement"
  correlationId?: string
}

export interface WorkflowRetrySpikePayload {
  workflowId: string
  retryCount: number
  windowMinutes: number
  threshold: number
  correlationId?: string
}

export interface AICostSpikePayload {
  organizationId: string
  costUsd: number
  windowHours: number
  baselineCostUsd: number
  spikeMultiplier: number
  correlationId?: string
}

export interface RecommendationGeneratedPayload {
  creatorId: string
  organizationId: string
  recommendationType: string
  title: string
  body: string
  priority: "low" | "medium" | "high" | "critical"
  correlationId?: string
}

export interface CustomerHighValuePayload {
  creatorId: string
  customerPhone?: string
  customerEmail?: string
  lifetimeValueKobo: number
  orderCount: number
  correlationId?: string
}

export interface IntelligenceRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
}
