import type { DatabaseClient } from "@lummy/db-core"
export class MonitoringService { constructor(private readonly db: DatabaseClient) {} async recordRuntimeMetric(name: string, value: number, tags: Record<string, string>) { return this.db.insert("runtime_metrics", { metric_name: name, metric_value: value, tags, observed_at: new Date().toISOString() }) } }
