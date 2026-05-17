import { randomUUID } from "crypto"
import type { CommerceEventEnvelope, CommerceEventPayload } from "./types"
import type { DomainEventName } from "@lummy/shared-types"

export function createCommerceEvent<T extends CommerceEventPayload>(input: {
  eventName: DomainEventName
  tenantId: string
  payload: T
  actorId?: string
  agentId?: string | null
  correlationId?: string
  causationId?: string | null
  idempotencyKey?: string
}): CommerceEventEnvelope {
  return {
    eventId: randomUUID(),
    eventName: input.eventName,
    tenantId: input.tenantId,
    actorId: input.actorId ?? "system",
    agentId: input.agentId ?? null,
    correlationId: input.correlationId ?? `${input.eventName}:${input.tenantId}:${Date.now()}`,
    causationId: input.causationId ?? null,
    idempotencyKey: input.idempotencyKey ?? `${input.eventName}:${input.tenantId}:${Date.now()}-${Math.random().toString(36).slice(2)}`,
    occurredAt: new Date().toISOString(),
    payload: input.payload,
    version: 1,
  }
}
