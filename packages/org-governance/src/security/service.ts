import type { DatabaseClient } from "@lummy/db-core"
export class SecurityPolicyService { constructor(private readonly db: DatabaseClient) {} async upsert(orgId: string, mfaRequired: boolean, ipAllowlist: string[]) { return this.db.upsert("organization_security_policies", { organization_id: orgId, mfa_required: mfaRequired, ip_allowlist: ipAllowlist, updated_at: new Date().toISOString() }) } }
