export interface MetricDefinition {
  key: string
  version: number
  description: string
  dimensions: string[]
}

export interface RollupEvent {
  tenantId: string
  stream: string
  eventId: string
  occurredAt: string
  idempotencyKey: string
  payload: Record<string, unknown>
}

export interface RollupCheckpoint {
  tenantId: string
  metricKey: string
  metricVersion: number
  cursor: string
  processedEvents: number
  updatedAt: string
}
