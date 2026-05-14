<<<<<<< HEAD
import type { DatabaseClient } from "@lummy/db-core"

export class DeliveryReconciliationService {
  constructor(private readonly db: DatabaseClient) {}
  async reconcile(providerMessageId: string, status: string, occurredAt: string) {
    await this.db.insert("message_delivery_events", { provider_message_id: providerMessageId, status, occurred_at: occurredAt })
    return this.db.update("message_dispatches", { provider_message_id: providerMessageId }, { status: "reconciled", updated_at: new Date().toISOString() })
=======
import type { DatabaseClient } from "../../db-core/src"

export class MessagingReconciliationService {
  constructor(private readonly db: DatabaseClient) {}

  async reconcileDispatchStatus(providerMessageId: string, status: string) {
    const update = await this.db.update("message_dispatches", { provider_message_id: providerMessageId }, {
      status,
      updated_at: new Date().toISOString(),
    })

    if (update.error) throw update.error
    return update.data
>>>>>>> main
  }
}
