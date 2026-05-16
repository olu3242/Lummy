import type { DatabaseClient } from "@lummy/db-core"
export class CreatorRankingService { constructor(private readonly db: DatabaseClient) {} async save(tenantId: string, creatorId: string, score: number) { return this.db.upsert("creator_rankings", { tenant_id: tenantId, creator_id: creatorId, score, updated_at: new Date().toISOString() }) } }
