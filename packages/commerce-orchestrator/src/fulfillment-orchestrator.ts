import type { EventBus } from "@lummy/events-core"
import { createCommerceEvent } from "./helpers"

export class FulfillmentOrchestrator {
  constructor(private readonly bus: EventBus) {}

  async start(input: { tenantId: string; orderId: string; fulfillmentId: string; warehouseId: string; correlationId?: string; metadata?: Record<string, unknown> }) {
    await this.bus.publish(createCommerceEvent({
      eventName: "fulfillment.started",
      tenantId: input.tenantId,
      correlationId: input.correlationId,
      idempotencyKey: `fulfillment.started:${input.tenantId}:${input.fulfillmentId}`,
      payload: {
        orderId: input.orderId,
        fulfillmentId: input.fulfillmentId,
        warehouseId: input.warehouseId,
        metadata: input.metadata,
      },
    }))
  }

  async delivered(input: { tenantId: string; orderId: string; fulfillmentId?: string; deliveredAt?: string; correlationId?: string; metadata?: Record<string, unknown> }) {
    await this.bus.publish(createCommerceEvent({
      eventName: "delivery.completed",
      tenantId: input.tenantId,
      correlationId: input.correlationId,
      idempotencyKey: `delivery.completed:${input.tenantId}:${input.orderId}:${input.fulfillmentId || "manual"}`,
      payload: {
        orderId: input.orderId,
        fulfillmentId: input.fulfillmentId,
        deliveredAt: input.deliveredAt || new Date().toISOString(),
        metadata: input.metadata,
      },
    }))
  }
}
