import type { DatabaseClient } from "@lummy/db-core"
export class GeoTenantRoutingService { constructor(private readonly db: DatabaseClient) {} async route(tenantId: string, regionCode: string, queueName: string) { return this.db.upsert("regional_queue_routes", { tenant_id: tenantId, region_code: regionCode, queue_name: queueName, updated_at: new Date().toISOString() }) } }
