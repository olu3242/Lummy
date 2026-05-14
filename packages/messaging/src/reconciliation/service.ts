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
  }
}
