import type { EventBus } from "@lummy/events-core"
import { createCommerceEvent } from "./helpers"
import { deriveNextOrderState, isValidTransition } from "./state-machine"
import type {
  CommerceEventEnvelope,
  CreateOrderInput,
  OrderRecord,
  OrderStatusChangedPayload,
  PaymentConfirmedPayload,
  FulfillmentStartedPayload,
  OrderCreatedPayload,
} from "./types"
import type { OrchestratorStore } from "./persistence"

export class OrderOrchestrator {
  constructor(
    private readonly store: OrchestratorStore,
    private readonly bus: EventBus,
  ) {}

  async createOrder(input: CreateOrderInput): Promise<OrderRecord> {
    const createdAt = new Date().toISOString()
    const payload: OrderCreatedPayload = {
      orderId: input.orderId,
      customerId: input.customerId,
      channel: input.channel,
      totalAmount: input.totalAmount,
      currency: input.currency,
      lineItems: input.lineItems,
      metadata: input.metadata,
    }

    const event = createCommerceEvent({
      eventName: "order.created",
      tenantId: input.tenantId,
      payload,
      idempotencyKey: `order.created:${input.tenantId}:${input.orderId}`,
    })

    return this.handleEvent(event)
  }

  async handleEvent(event: CommerceEventEnvelope): Promise<OrderRecord> {
    const orderId = (event.payload as { orderId: string }).orderId
    const existingOrder = await this.store.getOrder(orderId)

    if (existingOrder && existingOrder.updatedAt >= event.occurredAt) {
      return existingOrder
    }

    let order: OrderRecord

    switch (event.eventName) {
      case "order.created":
        order = await this.handleOrderCreated(event)
        break
      case "order.payment_confirmed":
        order = await this.handlePaymentConfirmed(event as CommerceEventEnvelope & { payload: PaymentConfirmedPayload })
        break
      case "order.fulfillment_started":
        order = await this.handleFulfillmentStarted(event as CommerceEventEnvelope & { payload: FulfillmentStartedPayload })
        break
      case "order.status_changed":
        order = await this.handleStatusChanged(event as CommerceEventEnvelope & { payload: OrderStatusChangedPayload })
        break
      default:
        throw new Error(`Unsupported commerce event: ${event.eventName}`)
    }

    await this.store.appendEvent(event)
    await this.store.appendOrderHistory({
      orderId,
      eventId: event.eventId,
      eventName: event.eventName,
      occurredAt: event.occurredAt,
      payload: event.payload,
    })

    return order
  }

  private async handleOrderCreated(event: CommerceEventEnvelope): Promise<OrderRecord> {
    const payload = event.payload as OrderCreatedPayload
    const order: OrderRecord = {
      orderId: payload.orderId,
      tenantId: event.tenantId,
      channel: payload.channel,
      customerId: payload.customerId,
      totalAmount: payload.totalAmount,
      currency: payload.currency,
      state: "payment_pending",
      createdAt: event.occurredAt,
      updatedAt: event.occurredAt,
      metadata: payload.metadata,
      lastEvent: event.eventId,
    }

    await this.store.upsertOrder(order)
    await this.publishStatusChange(order, "created", "payment_pending")
    return order
  }

  private async handlePaymentConfirmed(event: CommerceEventEnvelope & { payload: PaymentConfirmedPayload }): Promise<OrderRecord> {
    const payload = event.payload
    const order = await this.getOrderForEvent(payload.orderId)

    const nextState: typeof order.state = payload.status === "confirmed" ? "payment_confirmed" : "failed"
    if (!isValidTransition(order.state, nextState)) {
      throw new Error(`Cannot transition order ${order.orderId} from ${order.state} to ${nextState}`)
    }

    const updatedOrder = {
      ...order,
      state: nextState,
      updatedAt: event.occurredAt,
      lastEvent: event.eventId,
      metadata: { ...order.metadata, paymentId: payload.paymentId, provider: payload.provider },
    }

    await this.store.upsertOrder(updatedOrder)
    await this.publishStatusChange(order, order.state, nextState)
    return updatedOrder
  }

  private async handleFulfillmentStarted(event: CommerceEventEnvelope & { payload: FulfillmentStartedPayload }): Promise<OrderRecord> {
    const payload = event.payload
    const order = await this.getOrderForEvent(payload.orderId)
    const nextState: typeof order.state = "processing"

    if (!isValidTransition(order.state, nextState)) {
      throw new Error(`Cannot transition order ${order.orderId} from ${order.state} to ${nextState}`)
    }

    const updatedOrder = {
      ...order,
      state: nextState,
      updatedAt: event.occurredAt,
      lastEvent: event.eventId,
      metadata: { ...order.metadata, fulfillmentId: payload.fulfillmentId, warehouseId: payload.warehouseId },
    }

    await this.store.upsertOrder(updatedOrder)
    await this.publishStatusChange(order, order.state, nextState)
    return updatedOrder
  }

  private async handleStatusChanged(event: CommerceEventEnvelope & { payload: OrderStatusChangedPayload }): Promise<OrderRecord> {
    const payload = event.payload
    const order = await this.getOrderForEvent(payload.orderId)
    const nextState = payload.nextState

    if (!isValidTransition(order.state, nextState) && order.state !== nextState) {
      throw new Error(`Invalid status change from ${order.state} to ${nextState} for order ${order.orderId}`)
    }

    const updatedOrder = {
      ...order,
      state: nextState,
      updatedAt: event.occurredAt,
      lastEvent: event.eventId,
      metadata: { ...order.metadata, ...payload.metadata },
    }

    await this.store.upsertOrder(updatedOrder)
    return updatedOrder
  }

  private async publishStatusChange(order: OrderRecord, previousState: string, nextState: string): Promise<void> {
    const statusPayload: OrderStatusChangedPayload = {
      orderId: order.orderId,
      previousState: previousState as typeof order.state,
      nextState: nextState as typeof order.state,
      reason: `transitioned from ${previousState} to ${nextState}`,
    }

    const statusEvent = createCommerceEvent({
      eventName: "order.status_changed",
      tenantId: order.tenantId,
      payload: statusPayload,
      causationId: order.lastEvent ?? null,
      idempotencyKey: `order.status_changed:${order.tenantId}:${order.orderId}:${nextState}`,
    })

    await this.bus.publish(statusEvent)
  }

  private async getOrderForEvent(orderId: string): Promise<OrderRecord> {
    const order = await this.store.getOrder(orderId)
    if (!order) {
      throw new Error(`Order not found for event target: ${orderId}`)
    }
    return order
  }
}
