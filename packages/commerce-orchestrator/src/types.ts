import type { DomainEventName, EventEnvelope } from "@lummy/shared-types"

export type CommerceOrderState =
  | "created"
  | "payment_pending"
  | "payment_confirmed"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "failed"

export interface OrderLineItem {
  sku: string
  quantity: number
  price: number
  metadata?: Record<string, unknown>
}

export interface OrderCreatedPayload {
  orderId: string
  customerId: string
  channel: string
  totalAmount: number
  currency: string
  lineItems: OrderLineItem[]
  metadata?: Record<string, unknown>
}

export interface PaymentConfirmedPayload {
  orderId: string
  paymentId: string
  provider: string
  amount: number
  currency: string
  status: "confirmed" | "failed" | "pending"
  metadata?: Record<string, unknown>
}

export interface FulfillmentStartedPayload {
  orderId: string
  fulfillmentId: string
  warehouseId: string
  metadata?: Record<string, unknown>
}

export interface OrderStatusChangedPayload {
  orderId: string
  previousState: CommerceOrderState
  nextState: CommerceOrderState
  reason?: string
  metadata?: Record<string, unknown>
}

export type CommerceEventPayload =
  | OrderCreatedPayload
  | PaymentConfirmedPayload
  | FulfillmentStartedPayload
  | OrderStatusChangedPayload

export type CommerceEventEnvelope = EventEnvelope<CommerceEventPayload>

export interface OrderRecord {
  orderId: string
  tenantId: string
  state: CommerceOrderState
  channel: string
  customerId: string
  totalAmount: number
  currency: string
  createdAt: string
  updatedAt: string
  lastEvent?: string
  metadata?: Record<string, unknown>
}

export interface OrderHistoryEntry {
  orderId: string
  eventId: string
  eventName: DomainEventName
  occurredAt: string
  payload: CommerceEventPayload
}

export interface CreateOrderInput {
  tenantId: string
  orderId: string
  channel: string
  customerId: string
  totalAmount: number
  currency: string
  lineItems: OrderLineItem[]
  metadata?: Record<string, unknown>
}
