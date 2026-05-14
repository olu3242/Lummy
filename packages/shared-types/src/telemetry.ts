import type { TenantId, UserId } from "./tenant"

export interface TelemetryEvent {
  eventKey: string
  tenantId: TenantId
  userId: UserId | "anonymous"
  sessionId: string
  correlationId: string
  idempotencyKey: string
  source: "web" | "worker" | "function"
  properties: Record<string, unknown>
  occurredAt: string
}
