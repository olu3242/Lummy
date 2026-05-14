import type { DatabaseClient } from "@lummy/db-core"
export class RuntimeRecoveryService { constructor(private readonly db: DatabaseClient) {} async failover(sessionId: string, reason: string) { return this.db.insert("ai_runtime_failovers", { session_id: sessionId, reason, occurred_at: new Date().toISOString() }) } }
