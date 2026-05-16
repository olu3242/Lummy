import type { DatabaseClient } from "@lummy/db-core"
export class RuntimeFailoverService { constructor(private readonly db: DatabaseClient) {} async record(region: string, reason: string) { return this.db.insert("runtime_failover_events", { region, reason, occurred_at: new Date().toISOString() }) } }
