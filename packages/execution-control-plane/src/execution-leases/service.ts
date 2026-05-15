import type { DatabaseClient } from "@lummy/db-core"
export class ControlPlaneLeaseService { constructor(private readonly db: DatabaseClient) {} async lease(runId: string, owner: string) { return this.db.upsert("ai_execution_leases", { run_id: runId, owner, leased_at: new Date().toISOString() }) } }
