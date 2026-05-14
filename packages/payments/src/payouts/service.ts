import type { DatabaseClient } from "../../db-core/src"

export class PayoutService {
  constructor(private readonly db: DatabaseClient) {}

  async requestPayout(input: {
    tenantId: string
    amount: number
    currency: string
    destination: string
    idempotencyKey: string
  }) {
    const payout = await this.db.insert("payout_requests", {
      tenant_id: input.tenantId,
      amount: input.amount,
      currency: input.currency,
      destination: input.destination,
      status: "pending",
      idempotency_key: input.idempotencyKey,
      requested_at: new Date().toISOString(),
    })
    if (payout.error) throw payout.error
    return payout.data
  }
}
