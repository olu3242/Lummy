import type { DatabaseClient } from "@lummy/db-core"
export class RollupService {
  constructor(private readonly db: DatabaseClient) {}
  async applyEvent(input: { tenantId: string; metricKey: string; metricVersion: number; eventId: string; idempotencyKey: string; payload: Record<string, unknown>; occurredAt: string }) {
    const dedup = await this.db.findOne("analytics_rollup_dedup", { tenant_id: input.tenantId, idempotency_key: input.idempotencyKey, metric_key: input.metricKey, metric_version: input.metricVersion })
    if (dedup.data) return { replayed: true }
    await this.db.insert("analytics_daily", { tenant_id: input.tenantId, metric_key: input.metricKey, metric_version: input.metricVersion, event_id: input.eventId, payload: input.payload, occurred_at: input.occurredAt })
    await this.db.insert("analytics_rollup_dedup", { tenant_id: input.tenantId, idempotency_key: input.idempotencyKey, metric_key: input.metricKey, metric_version: input.metricVersion, created_at: new Date().toISOString() })
    return { replayed: false }
  }
}
