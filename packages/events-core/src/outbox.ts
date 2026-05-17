import type { EventEnvelope } from "@lummy/shared-types"
import type { DatabaseClient } from "@lummy/db-core"
import type { OutboxStore } from "./contracts"

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
      processed: false,
      created_at: new Date().toISOString(),
    })

    if (result.error) throw result.error
  }
}
