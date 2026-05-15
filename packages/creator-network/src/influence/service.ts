import type { DatabaseClient } from "@lummy/db-core"
export class InfluenceScoringService { constructor(private readonly db: DatabaseClient) {} async update(tenantId: string, creatorId: string, score: number) { return this.db.upsert("creator_influence_scores", { tenant_id: tenantId, creator_id: creatorId, score, updated_at: new Date().toISOString() }) } }
