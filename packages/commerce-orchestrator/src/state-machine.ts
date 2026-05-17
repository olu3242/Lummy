import type { CommerceOrderState } from "./types"
import type { DomainEventName } from "@lummy/shared-types"

export function deriveNextOrderState(
  currentState: CommerceOrderState,
  eventName: DomainEventName,
): CommerceOrderState {
  switch (eventName) {
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
    created: ["payment_pending", "cancelled", "failed"],
    payment_pending: ["payment_confirmed", "cancelled", "failed"],
    payment_confirmed: ["processing", "cancelled", "failed"],
    processing: ["shipped", "cancelled", "failed"],
    shipped: ["completed", "failed"],
    completed: [],
    cancelled: [],
    failed: [],
  }

  return allowedTransitions[currentState]?.includes(nextState) ?? false
}
