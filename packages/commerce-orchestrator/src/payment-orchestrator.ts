import type { EventBus } from "@lummy/events-core"
import { createCommerceEvent } from "./helpers"
import type { PaymentConfirmedPayload } from "./types"

export class PaymentOrchestrator {
  constructor(private readonly bus: EventBus) {}

  async markPending(input: { tenantId: string; orderId: string; paymentId: string; provider: string; amount: number; currency: string; correlationId?: string; metadata?: Record<string, unknown> }) {
    await this.bus.publish(createCommerceEvent({
      eventName: "payment.pending",
      tenantId: input.tenantId,
      correlationId: input.correlationId,
      idempotencyKey: `payment.pending:${input.tenantId}:${input.paymentId}`,
      payload: {
        orderId: input.orderId,
        paymentId: input.paymentId,
        provider: input.provider,
        amount: input.amount,
        currency: input.currency,
        status: "pending",
        metadata: input.metadata,
      } satisfies PaymentConfirmedPayload,
    }))
  }

  async confirm(input: { tenantId: string; orderId: string; paymentId: string; provider: string; amount: number; currency: string; correlationId?: string; metadata?: Record<string, unknown> }) {
    await this.bus.publish(createCommerceEvent({
      eventName: "payment.confirmed",
      tenantId: input.tenantId,
      correlationId: input.correlationId,
      idempotencyKey: `payment.confirmed:${input.tenantId}:${input.paymentId}`,
      payload: {
        orderId: input.orderId,
        paymentId: input.paymentId,
        provider: input.provider,
        amount: input.amount,
        currency: input.currency,
        status: "confirmed",
        metadata: input.metadata,
      } satisfies PaymentConfirmedPayload,
    }))
  }
}
