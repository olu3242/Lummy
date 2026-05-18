import type { DatabaseClient } from "@lummy/db-core"
export class AuditService { constructor(private readonly db: DatabaseClient) {} async record(scope: string, action: string, payload: Record<string, unknown>) { return this.db.insert("governance_audits", { scope, action, payload, created_at: new Date().toISOString() }) } }
