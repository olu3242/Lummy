import type { DatabaseClient } from "@lummy/db-core"
export class RewardService { constructor(private readonly db: DatabaseClient) {} async claim(tenantId: string, subjectId: string, rewardType: string, amount: number) { return this.db.insert("reward_claims", { tenant_id: tenantId, subject_id: subjectId, reward_type: rewardType, amount, created_at: new Date().toISOString() }) } }
