<<<<<<< HEAD
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
=======
import type { DatabaseClient } from "../../db-core/src"
import type { ProviderAdapter } from "../providers/types"

export class MessagingWebhookService {
  constructor(private readonly db: DatabaseClient, private readonly adapter: ProviderAdapter) {}

  async ingest(
    tenantId: string,
    headers: Record<string, string>,
    rawBody: string,
    eventKey: string,
    providerMessageId: string,
    status: string,
    occurredAt: string,
    idempotencyKey: string
  ) {
    if (!this.adapter.verifyWebhookSignature(headers, rawBody)) {
      throw new Error("Invalid messaging webhook signature")
    }

    const result = await this.db.insert("message_delivery_events", {
      tenant_id: tenantId,
      event_key: eventKey,
      provider_message_id: providerMessageId,
      status,
      occurred_at: occurredAt,
      idempotency_key: idempotencyKey,
      raw_payload: rawBody,
    })

    if (result.error) throw result.error
    return result.data
>>>>>>> main
  }
}
