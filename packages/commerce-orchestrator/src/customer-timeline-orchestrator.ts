import type { OrchestratorStore } from "./persistence"
import type { CommerceEventEnvelope } from "./types"

export class CustomerTimelineOrchestrator {
  constructor(private readonly store: OrchestratorStore) {}

  async record(event: CommerceEventEnvelope) {
    const payload = event.payload as { customerId?: string; orderId?: string; metadata?: Record<string, unknown> }
    await this.store.appendTimeline({
      tenantId: event.tenantId,
      subjectId: payload.customerId || payload.orderId || event.tenantId,
      subjectType: payload.customerId ? "customer" : "order",
      eventId: event.eventId,
      eventName: event.eventName,
      occurredAt: event.occurredAt,
      correlationId: event.correlationId,
      metadata: payload.metadata,
    })
  }
}
