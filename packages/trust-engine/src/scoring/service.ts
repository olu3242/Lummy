import type { DatabaseClient } from "@lummy/db-core"

export class TrustScoreService {
  constructor(private readonly db: DatabaseClient) {}
  async recompute(input: { tenantId: string; creatorId: string; version: number; idempotencyKey: string; signals: { reviewQuality: number; deliveryConsistency: number; refundRate: number; disputeFrequency: number; responseRate: number; repeatCustomers: number; engagementQuality: number; fraudIndicators: number; moderationHistory: number } }) {
    const existing = await this.db.findOne("creator_trust_scores", { tenant_id: input.tenantId, creator_id: input.creatorId, idempotency_key: input.idempotencyKey })
    if (existing.data) return { replayed: true }
    const score = (input.signals.reviewQuality + input.signals.deliveryConsistency + input.signals.responseRate + input.signals.repeatCustomers + input.signals.engagementQuality - input.signals.refundRate - input.signals.disputeFrequency - input.signals.fraudIndicators - input.signals.moderationHistory)
    await this.db.insert("creator_trust_scores", { tenant_id: input.tenantId, creator_id: input.creatorId, score, version: input.version, idempotency_key: input.idempotencyKey, created_at: new Date().toISOString() })
    return { replayed: false, score }
  }
}
