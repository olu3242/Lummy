import type { DatabaseClient } from "@lummy/db-core"
export class RegionalQueueRouter { constructor(private readonly db: DatabaseClient) {} async health(provider: string, region: string, status: string) { return this.db.upsert("regional_provider_health", { provider, region, status, updated_at: new Date().toISOString() }) } }
