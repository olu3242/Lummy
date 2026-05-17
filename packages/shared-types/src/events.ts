import type { TenantId, UserId } from "./tenant"

export type DomainEventName =
  | "lead.created"
  | "conversation.started"
  | "product.selected"
  | "checkout.initiated"
  | "payment.pending"
  | "payment.confirmed"
  | "creator.notified"
  | "fulfillment.started"
  | "delivery.completed"
  | "order.created"
  | "order.payment_confirmed"
  | "order.fulfillment_started"
  | "order.shipped"
  | "order.completed"
  | "order.cancelled"
  | "order.failed"
  | "order.status_changed"
  | "campaign.created"
  | "review.created"
  | "telemetry.recorded"

export interface EventEnvelope<TPayload = Record<string, unknown>> {
  eventId: string
  eventName: DomainEventName
  tenantId: TenantId
  actorId: UserId | "system"
  agentId: string | null
  correlationId: string
  causationId: string | null
  idempotencyKey: string
  occurredAt: string
  payload: TPayload
  version: 1
}
