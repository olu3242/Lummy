import type { EventEnvelope } from "@lummy/shared-types"
import type { OutboxStore } from "./contracts"
import { validateEventEnvelope } from "./schema"

export class EventPublisher {
  constructor(private readonly outbox: OutboxStore) {}

  async publish(event: EventEnvelope): Promise<void> {
    const validation = validateEventEnvelope(event)
    if (!validation.ok) throw new Error(validation.error)

    await this.outbox.append(event)
  }
}
