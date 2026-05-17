export type IntelligenceTelemetryEvent = {
  tenantId: string
  category: "graph" | "recommendation" | "trend" | "predictive"
  action: string
  score?: number
  metadata?: Record<string, unknown>
}

export const emitIntelligenceTelemetry = (event: IntelligenceTelemetryEvent): IntelligenceTelemetryEvent => event
