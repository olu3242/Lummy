import type { EventEnvelope } from "@lummy/shared-types"
import type { DatabaseClient } from "@lummy/db-core"

export interface OutboxStore {
  append(event: EventEnvelope): Promise<void>
}

export class SqlOutboxStore implements OutboxStore {
  constructor(private readonly db: DatabaseClient) {}

  async append(event: EventEnvelope): Promise<void> {
    const result = await this.db.insert("outbox_events", {
      event_id: event.eventId,
      event_name: event.eventName,
      tenant_id: event.tenantId,
      actor_id: event.actorId,
      agent_id: event.agentId,
      correlation_id: event.correlationId,
      causation_id: event.causationId,
      idempotency_key: event.idempotencyKey,
      occurred_at: event.occurredAt,
      payload: event.payload,
      version: event.version,
    })

    if (result.error) throw result.error
  }
}
