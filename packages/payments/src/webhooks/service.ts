import type { DatabaseClient } from "@lummy/db-core"
import type { PaymentProviderAdapter } from "../providers/types"
import { toWebhookEventEnvelope } from "../contracts/webhook"
export class WebhookReplayService {
  constructor(private readonly db: DatabaseClient, private readonly provider: PaymentProviderAdapter) {}
  async ingest(tenantId: string, headers: Record<string, string>, rawBody: string, eventKey: string, providerIntentId: string, idempotencyKey: string) {
    if (!tenantId || !eventKey || !providerIntentId || !idempotencyKey) throw new Error("missing webhook identifiers")
    if (!this.provider.verifyWebhookSignature(headers, rawBody)) throw new Error("Invalid payment webhook signature")
    const normalizedIdempotencyKey = idempotencyKey.trim().toLowerCase()
    const existing = await this.db.findOne("provider_webhook_logs", { tenant_id: tenantId, idempotency_key: normalizedIdempotencyKey })
    if (existing.data) return { replayed: true }
    const envelope = toWebhookEventEnvelope({
      tenantId,
      eventKey,
      providerIntentId,
      idempotencyKey: normalizedIdempotencyKey,
      correlationId: headers["x-correlation-id"] || normalizedIdempotencyKey,
      rawPayload: rawBody,
    })
    await this.db.insert("provider_webhook_logs", { tenant_id: envelope.tenantId, event_key: envelope.eventKey, provider_intent_id: envelope.providerIntentId, idempotency_key: envelope.idempotencyKey, raw_payload: envelope.rawPayload, received_at: envelope.receivedAt, processed: false, correlation_id: envelope.correlationId, schema_version: envelope.version })
    return { replayed: false }
  }
}
