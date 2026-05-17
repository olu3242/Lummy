import type { DatabaseClient } from "@lummy/db-core"
import type { ProviderAdapter } from "../providers/types"

export class WebhookService {
  constructor(private readonly db: DatabaseClient, private readonly adapter: ProviderAdapter) {}
  async ingest(tenantId: string, headers: Record<string, string>, rawBody: string, idempotencyKey: string) {
    if (!this.adapter.verifyWebhookSignature(headers, rawBody)) throw new Error("Invalid messaging webhook signature")
    const existing = await this.db.findOne("provider_webhook_events", { tenant_id: tenantId, idempotency_key: idempotencyKey })
    if (existing.data) return { replayed: true }
    await this.db.insert("provider_webhook_events", { tenant_id: tenantId, idempotency_key: idempotencyKey, raw_payload: rawBody, received_at: new Date().toISOString() })
    return { replayed: false }
  }
}
