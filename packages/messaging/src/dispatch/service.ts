import type { DatabaseClient } from "../../db-core/src"
import type { ProviderAdapter, ProviderMessagePayload } from "../providers/types"

export class MessagingDispatchService {
  constructor(private readonly db: DatabaseClient, private readonly adapter: ProviderAdapter) {}

  async dispatch(payload: ProviderMessagePayload, tenantId: string) {
    const send = await this.adapter.send(payload)
    if (!send.accepted) throw new Error("Provider rejected message")

    const result = await this.db.insert("message_dispatches", {
      tenant_id: tenantId,
      provider: payload.provider,
      to_address: payload.to,
      template_id: payload.templateId,
      content: payload.content,
      idempotency_key: payload.idempotencyKey,
      provider_message_id: send.providerMessageId,
      status: "accepted",
      accepted_at: new Date().toISOString(),
      metadata: send.raw,
    })

    if (result.error) throw result.error
    return result.data
  }
}
