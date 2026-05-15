import type { DatabaseClient } from "@lummy/db-core"
export class MetricsQueryService { constructor(private readonly db: DatabaseClient) {} async latest(tenantId: string, metricKey: string) { return this.db.findOne("analytics_daily", { tenant_id: tenantId, metric_key: metricKey }) } }
