import type { TelemetryEvent } from "../../shared-types/src"
import type { DatabaseClient } from "../../db-core/src"

export interface TelemetrySink {
  track(event: TelemetryEvent): Promise<void>
}

export class SqlTelemetrySink implements TelemetrySink {
  constructor(private readonly db: DatabaseClient) {}

  async track(event: TelemetryEvent): Promise<void> {
    const result = await this.db.insert("telemetry_logs", {
      event_key: event.eventKey,
      tenant_id: event.tenantId,
      user_id: event.userId,
      session_id: event.sessionId,
      correlation_id: event.correlationId,
      idempotency_key: event.idempotencyKey,
      source: event.source,
      properties: event.properties,
      occurred_at: event.occurredAt,
    })

    if (result.error) throw result.error
  }
}
