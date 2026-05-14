import type { DatabaseClient } from "@lummy/db-core"
export class FunnelService { constructor(private readonly db: DatabaseClient) {} async recordStep(tenantId: string, userId: string, funnelKey: string, step: string) { return this.db.insert("analytics_funnel_steps", { tenant_id: tenantId, user_id: userId, funnel_key: funnelKey, step, occurred_at: new Date().toISOString() }) } }
