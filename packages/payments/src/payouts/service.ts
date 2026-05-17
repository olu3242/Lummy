import type { DatabaseClient } from "@lummy/db-core"
export class PayoutService {
  constructor(private readonly db: DatabaseClient) {}
  async requestPayout(input: { tenantId: string; amount: number; currency: string; destination: string; idempotencyKey: string }) {
    return this.db.insert("payout_requests", { tenant_id: input.tenantId, amount: input.amount, currency: input.currency, destination: input.destination, status: "initiated", idempotency_key: input.idempotencyKey, requested_at: new Date().toISOString() })
  }
}
