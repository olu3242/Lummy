import type { DatabaseClient } from "@lummy/db-core"
export class DiscoveryService { constructor(private readonly db: DatabaseClient) {} async persistSession(tenantId: string, sessionId: string, rankedIds: string[]) { return this.db.insert("discovery_sessions", { tenant_id: tenantId, session_id: sessionId, ranked_ids: rankedIds, created_at: new Date().toISOString() }) } }
