import type { DatabaseClient } from "../../db-core/src"

export class SessionService {
  constructor(private readonly db: DatabaseClient) {}

  async touchSession(input: {
    sessionId: string
    tenantId?: string
    userId?: string
    source: string
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
    referrer?: string
  }) {
    return this.db.insert("user_sessions", {
      session_id: input.sessionId,
      tenant_id: input.tenantId,
      user_id: input.userId,
      source: input.source,
      utm_source: input.utmSource,
      utm_medium: input.utmMedium,
      utm_campaign: input.utmCampaign,
      referrer: input.referrer,
      last_seen_at: new Date().toISOString(),
    })
  }
}
