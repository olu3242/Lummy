import type { DatabaseClient } from "@lummy/db-core"
import type { RollupCheckpoint, RollupEvent } from "./types"

export class AnalyticsRollupPipeline {
  constructor(private readonly db: DatabaseClient) {}

  async applyEvent(metricKey: string, metricVersion: number, event: RollupEvent) {
    const existing = await this.db.findOne("analytics_rollup_dedup", {
      tenant_id: event.tenantId,
      idempotency_key: event.idempotencyKey,
      metric_key: metricKey,
      metric_version: metricVersion,
    })

    if (existing.data) return { replayed: true }

    await this.db.insert("analytics_rollup_events", {
      tenant_id: event.tenantId,
      metric_key: metricKey,
      metric_version: metricVersion,
      stream: event.stream,
      event_id: event.eventId,
      occurred_at: event.occurredAt,
      payload: event.payload,
      idempotency_key: event.idempotencyKey,
    })

    await this.db.insert("analytics_rollup_dedup", {
      tenant_id: event.tenantId,
      metric_key: metricKey,
      metric_version: metricVersion,
      idempotency_key: event.idempotencyKey,
      created_at: new Date().toISOString(),
    })

    return { replayed: false }
  }

  async checkpoint(state: RollupCheckpoint) {
    return this.db.upsert("analytics_rollup_checkpoints", {
      tenant_id: state.tenantId,
      metric_key: state.metricKey,
      metric_version: state.metricVersion,
      cursor: state.cursor,
      processed_events: state.processedEvents,
      updated_at: state.updatedAt,
    })
  }
}
