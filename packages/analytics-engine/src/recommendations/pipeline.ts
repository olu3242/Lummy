import type { DatabaseClient } from "@lummy/db-core"

export class RecommendationRollupPipeline {
  constructor(private readonly db: DatabaseClient) {}

  async publishCandidate(input: {
    tenantId: string
    entityId: string
    recommendationType: string
    score: number
    modelVersion: string
    idempotencyKey: string
  }) {
    const dedup = await this.db.findOne("analytics_recommendation_dedup", {
      tenant_id: input.tenantId,
      idempotency_key: input.idempotencyKey,
    })
    if (dedup.data) return { replayed: true }

    await this.db.insert("analytics_recommendations", {
      tenant_id: input.tenantId,
      entity_id: input.entityId,
      recommendation_type: input.recommendationType,
      score: input.score,
      model_version: input.modelVersion,
      idempotency_key: input.idempotencyKey,
      created_at: new Date().toISOString(),
    })

    await this.db.insert("analytics_recommendation_dedup", {
      tenant_id: input.tenantId,
      idempotency_key: input.idempotencyKey,
      created_at: new Date().toISOString(),
    })
    return { replayed: false }
  }
}
