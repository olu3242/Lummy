import type { EventEnvelope } from "../../shared-types/src"
import type { OutboxStore } from "./outbox"

export class EventPublisher {
  constructor(private readonly outbox: OutboxStore) {}

  async publish(event: EventEnvelope): Promise<void> {
    await this.outbox.append(event)
  }
}
