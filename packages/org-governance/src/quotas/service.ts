import type { DatabaseClient } from "@lummy/db-core"
export class QuotaService { constructor(private readonly db: DatabaseClient) {} async set(orgId: string, quotaKey: string, quotaValue: number) { return this.db.upsert("organization_quotas", { organization_id: orgId, quota_key: quotaKey, quota_value: quotaValue, updated_at: new Date().toISOString() }) } }
