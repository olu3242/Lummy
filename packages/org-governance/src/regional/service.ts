import type { DatabaseClient } from "@lummy/db-core"
export class RegionalGovernanceService { constructor(private readonly db: DatabaseClient) {} async configure(orgId: string, country: string, timezone: string, currency: string) { return this.db.upsert("organization_regions", { organization_id: orgId, country, timezone, currency, updated_at: new Date().toISOString() }) } }
