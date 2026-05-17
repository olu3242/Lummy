import type { DomainEventName, EventEnvelope } from "@lummy/shared-types"

export type CommerceOrderState =
  | "lead_created"
  | "conversation_started"
  | "product_selected"
  | "checkout_initiated"
  | "created"
  | "payment_pending"
  | "payment_confirmed"
  | "creator_notified"
  | "fulfillment_started"
  | "processing"
  | "delivered"
  | "shipped"
  | "completed"
  | "cancelled"
  | "failed"

export const CANONICAL_COMMERCE_FLOW = [
  "lead_created",
  "conversation_started",
  "product_selected",
  "checkout_initiated",
  "payment_pending",
  "payment_confirmed",
  "creator_notified",
  "fulfillment_started",
  "delivered",
  "completed",
] as const

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

export interface ConversationStartedPayload {
  orderId: string
  customerId: string
  channel: string
  messageExcerpt?: string
  metadata?: Record<string, unknown>
}

export interface ProductSelectedPayload {
  orderId: string
  customerId: string
  productId: string
  quantity?: number
  metadata?: Record<string, unknown>
}

export interface CheckoutInitiatedPayload {
  orderId: string
  checkoutId: string
  amount: number
  currency: string
  metadata?: Record<string, unknown>
}

export interface CreatorNotifiedPayload {
  orderId: string
  creatorId: string
  channel: string
  metadata?: Record<string, unknown>
}

export interface DeliveredPayload {
  orderId: string
  fulfillmentId?: string
  deliveredAt: string
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
  | ConversationStartedPayload
  | ProductSelectedPayload
  | CheckoutInitiatedPayload
  | PaymentConfirmedPayload
  | FulfillmentStartedPayload
  | CreatorNotifiedPayload
  | DeliveredPayload
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

export interface CommerceTimelineEntry {
  tenantId: string
  subjectId: string
  subjectType: "customer" | "order" | "conversation" | "automation"
  eventName: string
  eventId: string
  occurredAt: string
  correlationId: string
  metadata?: Record<string, unknown>
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

export interface CommerceRuntimeResult {
  accepted: boolean
  orderId: string
  state: CommerceOrderState
  correlationId: string
}
