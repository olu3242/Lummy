import type { DatabaseClient } from "@lummy/db-core"
export class GeoTelemetryService { constructor(private readonly db: DatabaseClient) {} async execution(routeKey: string, region: string, latencyMs: number) { return this.db.insert("geo_execution_logs", { route_key: routeKey, region, latency_ms: latencyMs, created_at: new Date().toISOString() }) } }
