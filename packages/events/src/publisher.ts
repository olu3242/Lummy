<<<<<<< HEAD
import type { EventEnvelope } from "@lummy/shared-types"
=======
import type { EventEnvelope } from "../../shared-types/src"
>>>>>>> main
import type { OutboxStore } from "./outbox"

export class EventPublisher {
  constructor(private readonly outbox: OutboxStore) {}

  async publish(event: EventEnvelope): Promise<void> {
    await this.outbox.append(event)
  }
}
