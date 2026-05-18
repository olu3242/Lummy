import type { DatabaseClient } from "@lummy/db-core"
export class ExecutionLeaseService { constructor(private readonly db: DatabaseClient) {} async acquire(runId: string, owner: string, ttlSeconds: number) { return this.db.insert("ai_execution_leases", { run_id: runId, owner, ttl_seconds: ttlSeconds, acquired_at: new Date().toISOString() }) } }
