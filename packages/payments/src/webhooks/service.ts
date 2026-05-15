import type { DatabaseClient } from "@lummy/db-core"
import type { PaymentProviderAdapter } from "../providers/types"
export class WebhookReplayService {
  constructor(private readonly db: DatabaseClient, private readonly provider: PaymentProviderAdapter) {}
  async ingest(tenantId: string, headers: Record<string, string>, rawBody: string, eventKey: string, providerIntentId: string, idempotencyKey: string) {
    if (!this.provider.verifyWebhookSignature(headers, rawBody)) throw new Error("Invalid payment webhook signature")
    const existing = await this.db.findOne("provider_webhook_logs", { tenant_id: tenantId, idempotency_key: idempotencyKey })
    if (existing.data) return { replayed: true }
    await this.db.insert("provider_webhook_logs", { tenant_id: tenantId, event_key: eventKey, provider_intent_id: providerIntentId, idempotency_key: idempotencyKey, raw_payload: rawBody, received_at: new Date().toISOString(), processed: false })
    return { replayed: false }
  }
}
