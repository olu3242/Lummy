import type { DatabaseClient } from "@lummy/db-core"
export class EcosystemTelemetryService { constructor(private readonly db: DatabaseClient) {} async usage(tenantId: string, route: string, latencyMs: number) { return this.db.insert("api_usage_logs", { tenant_id: tenantId, route, latency_ms: latencyMs, recorded_at: new Date().toISOString() }) } }
