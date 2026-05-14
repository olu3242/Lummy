import type { DatabaseClient } from "@lummy/db-core"
export class PermissionService { constructor(private readonly db: DatabaseClient) {} async grant(orgId: string, role: string, permission: string) { return this.db.insert("organization_permissions", { organization_id: orgId, role, permission, created_at: new Date().toISOString() }) } }
