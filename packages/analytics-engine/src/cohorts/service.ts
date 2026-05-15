import type { DatabaseClient } from "@lummy/db-core"
export class CohortService { constructor(private readonly db: DatabaseClient) {} async assign(tenantId: string, userId: string, cohortKey: string) { return this.db.upsert("analytics_cohort_memberships", { tenant_id: tenantId, user_id: userId, cohort_key: cohortKey, assigned_at: new Date().toISOString() }) } }
