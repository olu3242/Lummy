import type { DatabaseClient } from "@lummy/db-core"
import type { ProviderAdapter, ProviderMessagePayload } from "../providers/types"

export class DispatchService {
  constructor(private readonly db: DatabaseClient, private readonly adapter: ProviderAdapter) {}
  async dispatch(payload: ProviderMessagePayload, tenantId: string) {
    const send = await this.adapter.send(payload)
    if (!send.accepted) throw new Error("Provider rejected message")
    return this.db.insert("message_dispatches", { tenant_id: tenantId, provider: payload.provider, to_address: payload.to, template_id: payload.templateId, content: payload.content, idempotency_key: payload.idempotencyKey, provider_message_id: send.providerMessageId, status: "sent", accepted_at: new Date().toISOString(), metadata: send.raw })
  }
}
