import type { DatabaseClient } from "@lummy/db-core"
export class OrgFeatureFlagService { constructor(private readonly db: DatabaseClient) {} async set(orgId: string, flagKey: string, enabled: boolean) { return this.db.upsert("organization_feature_flags", { organization_id: orgId, flag_key: flagKey, enabled, updated_at: new Date().toISOString() }) } }
