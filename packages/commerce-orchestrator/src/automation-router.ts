import type { EventBus } from "@lummy/events-core"
import type { CommerceEventEnvelope } from "./types"

export interface CommerceAutomationQueue {
  enqueue(queueName: string, payload: Record<string, unknown>): Promise<void>
}

const AUTOMATION_EVENTS = new Set([
  "conversation.started",
  "checkout.initiated",
  "payment.pending",
  "payment.confirmed",
  "delivery.completed",
])

export class AutomationRouter {
  constructor(private readonly queue: CommerceAutomationQueue) {}

  attach(bus: EventBus) {
    for (const eventName of AUTOMATION_EVENTS) {
      bus.subscribe(eventName as CommerceEventEnvelope["eventName"], (event) => this.route(event as CommerceEventEnvelope))
    }
  }

  async route(event: CommerceEventEnvelope) {
    await this.queue.enqueue("automation.execute", {
      trigger: event.eventName,
      payload: {
        eventId: event.eventId,
        tenantId: event.tenantId,
        correlationId: event.correlationId,
        causationId: event.causationId,
        idempotencyKey: `automation:${event.idempotencyKey}`,
        data: event.payload,
      },
    })
  }
}
