export const PAYMENT_WEBHOOK_EVENT_VERSION = 1 as const

export interface PaymentWebhookEventEnvelope {
  version: typeof PAYMENT_WEBHOOK_EVENT_VERSION
  tenantId: string
  eventKey: string
  providerIntentId: string
  idempotencyKey: string
  correlationId: string
  receivedAt: string
  rawPayload: string
}

export function toWebhookEventEnvelope(input: {
  tenantId: string
  eventKey: string
  providerIntentId: string
  idempotencyKey: string
  correlationId: string
  rawPayload: string
}): PaymentWebhookEventEnvelope {
  return {
    version: PAYMENT_WEBHOOK_EVENT_VERSION,
    tenantId: input.tenantId,
    eventKey: input.eventKey,
    providerIntentId: input.providerIntentId,
    idempotencyKey: input.idempotencyKey,
    correlationId: input.correlationId,
    receivedAt: new Date().toISOString(),
    rawPayload: input.rawPayload,
  }
}

