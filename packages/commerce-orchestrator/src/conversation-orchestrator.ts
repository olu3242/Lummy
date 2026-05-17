import type { EventBus } from "@lummy/events-core"
import { createCommerceEvent } from "./helpers"

export class ConversationOrchestrator {
  constructor(private readonly bus: EventBus) {}

  async start(input: { tenantId: string; orderId: string; customerId: string; channel: string; messageExcerpt?: string; correlationId?: string; metadata?: Record<string, unknown> }) {
    await this.bus.publish(createCommerceEvent({
      eventName: "conversation.started",
      tenantId: input.tenantId,
      correlationId: input.correlationId,
      idempotencyKey: `conversation.started:${input.tenantId}:${input.orderId}:${input.channel}`,
      payload: {
        orderId: input.orderId,
        customerId: input.customerId,
        channel: input.channel,
        messageExcerpt: input.messageExcerpt,
        metadata: input.metadata,
      },
    }))
  }

  async selectProduct(input: { tenantId: string; orderId: string; customerId: string; productId: string; quantity?: number; correlationId?: string; metadata?: Record<string, unknown> }) {
    await this.bus.publish(createCommerceEvent({
      eventName: "product.selected",
      tenantId: input.tenantId,
      correlationId: input.correlationId,
      idempotencyKey: `product.selected:${input.tenantId}:${input.orderId}:${input.productId}`,
      payload: {
        orderId: input.orderId,
        customerId: input.customerId,
        productId: input.productId,
        quantity: input.quantity,
        metadata: input.metadata,
      },
    }))
  }
}
