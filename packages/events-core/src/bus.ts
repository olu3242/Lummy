import type { DomainEventName, EventEnvelope } from "@lummy/shared-types"
import type { DeadLetterStore, EventHandler } from "./contracts"
import { EventPublisher } from "./publisher"

type AnyEventEnvelope = EventEnvelope<any>

export class EventBus {
  private readonly subscribers = new Map<DomainEventName, EventHandler[]>()

  constructor(
    private readonly publisher: EventPublisher,
    private readonly deadLetterStore?: DeadLetterStore,
  ) {}

  subscribe(eventName: DomainEventName, handler: EventHandler): void {
    const handlers = this.subscribers.get(eventName) ?? []
    handlers.push(handler)
    this.subscribers.set(eventName, handlers)
  }

  async publish(event: AnyEventEnvelope): Promise<void> {
    await this.publisher.publish(event)
    await this.dispatch(event)
  }

  async dispatch(event: AnyEventEnvelope): Promise<void> {
    const handlers = this.subscribers.get(event.eventName) ?? []
    if (handlers.length === 0) {
      return
    }

    for (const handler of handlers) {
      try {
        await handler(event)
      } catch (error) {
        if (this.deadLetterStore) {
          await this.deadLetterStore.append({
            event,
            reason: error instanceof Error ? error.message : String(error),
            attempts: 1,
            failedAt: new Date().toISOString(),
          })
        }

        console.error(JSON.stringify({
          event: "event.dispatch.error",
          eventName: event.eventName,
          eventId: event.eventId,
          tenantId: event.tenantId,
          error: error instanceof Error ? error.message : String(error),
        }))
      }
    }
  }
}
