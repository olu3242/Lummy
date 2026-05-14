import type { DatabaseClient } from "../../db-core/src"
import type { PaymentProviderAdapter } from "../providers/types"

export class PaymentWebhookService {
  constructor(private readonly db: DatabaseClient, private readonly provider: PaymentProviderAdapter) {}

  async ingest(
    tenantId: string,
    headers: Record<string, string>,
    rawBody: string,
    eventKey: string,
    providerIntentId: string,
    idempotencyKey: string
  ) {
    if (!this.provider.verifyWebhookSignature(headers, rawBody)) {
      throw new Error("Invalid payment webhook signature")
    }

    const log = await this.db.insert("provider_webhook_logs", {
      tenant_id: tenantId,
      event_key: eventKey,
      provider_intent_id: providerIntentId,
      idempotency_key: idempotencyKey,
      raw_payload: rawBody,
      received_at: new Date().toISOString(),
      processed: false,
    })

    if (log.error) throw log.error
    return log.data
  }
}
