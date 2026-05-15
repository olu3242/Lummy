import type { DatabaseClient } from "@lummy/db-core"

export class AnalyticsObservabilityService {
  constructor(private readonly db: DatabaseClient) {}

  async emitRollupHealth(tenantId: string, pipeline: string, lagSeconds: number, errorRate: number) {
    return this.db.insert("analytics_pipeline_health", {
      tenant_id: tenantId,
      pipeline,
      lag_seconds: lagSeconds,
      error_rate: errorRate,
      observed_at: new Date().toISOString(),
    })
  }
}
