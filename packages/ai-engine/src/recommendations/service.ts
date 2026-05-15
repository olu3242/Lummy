import type { DatabaseClient } from "@lummy/db-core"
export class AIRecommendationService { constructor(private readonly db: DatabaseClient) {} async publish(tenantId: string, subjectId: string, recommendation: string, score: number) { return this.db.insert("ai_recommendations", { tenant_id: tenantId, subject_id: subjectId, recommendation, score, created_at: new Date().toISOString() }) } }
