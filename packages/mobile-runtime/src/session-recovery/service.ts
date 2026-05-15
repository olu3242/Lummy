import type { DatabaseClient } from "@lummy/db-core"
export class SessionRecoveryService { constructor(private readonly db: DatabaseClient) {} async heartbeat(sessionId: string, tenantId: string) { return this.db.upsert("mobile_sessions", { session_id: sessionId, tenant_id: tenantId, heartbeat_at: new Date().toISOString() }) } }
