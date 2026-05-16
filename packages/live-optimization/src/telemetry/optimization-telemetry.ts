export type OptimizationTelemetryEvent = {
  tenantId: string
  experimentId?: string
  metric: "ab_test" | "behavior" | "optimization" | "funnel"
  value: number
  metadata?: Record<string, unknown>
}

export const emitOptimizationTelemetry = (event: OptimizationTelemetryEvent): OptimizationTelemetryEvent => event
