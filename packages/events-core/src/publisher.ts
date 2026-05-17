import type { EventEnvelope } from "@lummy/shared-types"
import type { OutboxStore } from "./contracts"

export class EventPublisher {
  constructor(private readonly outbox: OutboxStore) {}

  async publish(event: EventEnvelope): Promise<void> {
    if (event.version !== 1) {
      throw new Error(`Unsupported event version ${event.version} for ${event.eventName}`)
    }

    await this.outbox.append(event)
  }
}
