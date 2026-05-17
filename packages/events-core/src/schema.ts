import type { EventEnvelope } from "@lummy/shared-types"

export interface EventValidationResult {
  ok: boolean
  error?: string
}

export function validateEventEnvelope(event: EventEnvelope): EventValidationResult {
  if (!event.eventId) return { ok: false, error: "eventId is required" }
  if (!event.eventName) return { ok: false, error: "eventName is required" }
  if (!event.tenantId) return { ok: false, error: "tenantId is required" }
  if (!event.correlationId) return { ok: false, error: "correlationId is required" }
  if (!event.idempotencyKey) return { ok: false, error: "idempotencyKey is required" }
  if (event.version !== 1) return { ok: false, error: `unsupported event version ${event.version}` }
  return { ok: true }
}

export function eventTraceMetadata(event: EventEnvelope) {
  return {
    eventId: event.eventId,
    eventName: event.eventName,
    tenantId: event.tenantId,
    correlationId: event.correlationId,
    causationId: event.causationId,
    idempotencyKey: event.idempotencyKey,
  }
}
