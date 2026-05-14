import type { DatabaseClient } from "../../db-core/src"
import type { PaymentIntentInput, PaymentProviderAdapter } from "../providers/types"

export class PaymentIntentService {
  constructor(private readonly db: DatabaseClient, private readonly provider: PaymentProviderAdapter) {}

  async create(input: PaymentIntentInput) {
    const res = await this.provider.createIntent(input)
    const created = await this.db.insert("payment_intents", {
      tenant_id: input.tenantId,
      provider: input.provider,
      provider_intent_id: res.providerIntentId,
      customer_id: input.customerId,
      amount: input.amount,
      currency: input.currency,
      status: res.status,
      idempotency_key: input.idempotencyKey,
      metadata: input.metadata || {},
      provider_payload: res.raw,
      created_at: new Date().toISOString(),
    })

    if (created.error) throw created.error
    return { intent: created.data, checkoutUrl: res.checkoutUrl }
  }
}
