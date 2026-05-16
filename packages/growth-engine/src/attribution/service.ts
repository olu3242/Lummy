import type { DatabaseClient } from "@lummy/db-core"
export class AttributionExpansionService { constructor(private readonly db: DatabaseClient) {} async expand(tenantId: string, sourceEventId: string, lineage: Record<string, unknown>) { return this.db.insert("attribution_expansions", { tenant_id: tenantId, source_event_id: sourceEventId, lineage, created_at: new Date().toISOString() }) } }
