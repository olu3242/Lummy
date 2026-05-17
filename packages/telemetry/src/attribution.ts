import type { DatabaseClient } from "@lummy/db-core"

export class AttributionService {
  constructor(private readonly db: DatabaseClient) {}

  async recordConversion(input: {
    tenantId: string
    sessionId?: string
    userId?: string
    conversionType: string
    amount?: number
    currency?: string
    sourceEventId?: string
  }) {
    return this.db.insert("conversion_events", {
      tenant_id: input.tenantId,
      session_id: input.sessionId,
      user_id: input.userId,
      conversion_type: input.conversionType,
      amount: input.amount,
      currency: input.currency,
      source_event_id: input.sourceEventId,
      occurred_at: new Date().toISOString(),
    })
  }
}
