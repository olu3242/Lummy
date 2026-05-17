import type { DatabaseClient } from "@lummy/db-core"

export class DeliveryReconciliationService {
  constructor(private readonly db: DatabaseClient) {}
  async reconcile(providerMessageId: string, status: string, occurredAt: string) {
    await this.db.insert("message_delivery_events", { provider_message_id: providerMessageId, status, occurred_at: occurredAt })
    return this.db.update("message_dispatches", { provider_message_id: providerMessageId }, { status: "reconciled", updated_at: new Date().toISOString() })
  }
}
