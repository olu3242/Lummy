import type { DatabaseClient } from "@lummy/db-core"
export class OrgAuditService { constructor(private readonly db: DatabaseClient) {} async record(orgId: string, action: string, payload: Record<string, unknown>) { return this.db.insert("organization_audit_exports", { organization_id: orgId, action, payload, created_at: new Date().toISOString() }) } }
