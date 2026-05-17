import type { EventEnvelope } from "@lummy/shared-types"

export class EventReplayGuard {
  private readonly seen = new Set<string>()

  accept(event: EventEnvelope) {
    if (this.seen.has(event.idempotencyKey)) return false
    this.seen.add(event.idempotencyKey)
    return true
  }
}
