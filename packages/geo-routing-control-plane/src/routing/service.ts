import type { DatabaseClient } from "@lummy/db-core"
export class ProviderRoutingService { constructor(private readonly db: DatabaseClient) {} async route(providerType: string, country: string, region: string) { return this.db.upsert("provider_routes", { provider_type: providerType, country, region, updated_at: new Date().toISOString() }) } }
