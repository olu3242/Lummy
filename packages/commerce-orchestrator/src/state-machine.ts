import type { CommerceOrderState } from "./types"
import type { DomainEventName } from "@lummy/shared-types"

export function deriveNextOrderState(
  currentState: CommerceOrderState,
  eventName: DomainEventName,
): CommerceOrderState {
  switch (eventName) {
    case "lead.created":
      return "lead_created"
    case "conversation.started":
      return "conversation_started"
    case "product.selected":
      return "product_selected"
    case "checkout.initiated":
      return "checkout_initiated"
    case "payment.pending":
      return "payment_pending"
    case "payment.confirmed":
      return "payment_confirmed"
    case "creator.notified":
      return "creator_notified"
    case "fulfillment.started":
      return "fulfillment_started"
    case "delivery.completed":
      return "delivered"
    case "order.created":
      return "payment_pending"
    case "order.payment_confirmed":
      return "payment_confirmed"
    case "order.fulfillment_started":
      return "processing"
    case "order.shipped":
      return "shipped"
    case "order.completed":
      return "completed"
    case "order.cancelled":
      return "cancelled"
    case "order.failed":
      return "failed"
    case "order.status_changed":
      return currentState
    default:
      return currentState
  }
}

export function isValidTransition(
  currentState: CommerceOrderState,
  nextState: CommerceOrderState,
): boolean {
  const allowedTransitions: Record<CommerceOrderState, CommerceOrderState[]> = {
    lead_created: ["conversation_started", "cancelled", "failed"],
    conversation_started: ["product_selected", "checkout_initiated", "cancelled", "failed"],
    product_selected: ["checkout_initiated", "cancelled", "failed"],
    checkout_initiated: ["payment_pending", "cancelled", "failed"],
    created: ["payment_pending", "conversation_started", "cancelled", "failed"],
    payment_pending: ["payment_confirmed", "cancelled", "failed"],
    payment_confirmed: ["creator_notified", "processing", "fulfillment_started", "cancelled", "failed"],
    creator_notified: ["fulfillment_started", "processing", "cancelled", "failed"],
    fulfillment_started: ["processing", "delivered", "cancelled", "failed"],
    processing: ["shipped", "delivered", "cancelled", "failed"],
    delivered: ["completed", "failed"],
    shipped: ["delivered", "completed", "failed"],
    completed: [],
    cancelled: [],
    failed: [],
  }

  return allowedTransitions[currentState]?.includes(nextState) ?? false
}
