import type { DatabaseClient } from "@lummy/db-core"

export class AnalyticsRollbackService {
  constructor(private readonly db: DatabaseClient) {}

  async markMetricDeprecated(metricKey: string, metricVersion: number, reason: string) {
    return this.db.insert("analytics_metric_rollbacks", {
      metric_key: metricKey,
      metric_version: metricVersion,
      reason,
      rolled_back_at: new Date().toISOString(),
    })
  }
}
