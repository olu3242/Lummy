import type { DatabaseClient } from "@lummy/db-core"
export class LatencyRoutingService { constructor(private readonly db: DatabaseClient) {} async log(region: string, latencyMs: number) { return this.db.insert("latency_profiles", { region, latency_ms: latencyMs, created_at: new Date().toISOString() }) } }
