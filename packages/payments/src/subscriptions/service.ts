import type { DatabaseClient } from "@lummy/db-core"
export class SubscriptionService {
  constructor(private readonly db: DatabaseClient) {}
  async upsertSubscription(input: { tenantId: string; customerId: string; providerSubscriptionId: string; status: string; planCode: string }) {
    return this.db.upsert("subscription_records", { tenant_id: input.tenantId, customer_id: input.customerId, provider_subscription_id: input.providerSubscriptionId, status: input.status, plan_code: input.planCode, updated_at: new Date().toISOString() })
  }
}
