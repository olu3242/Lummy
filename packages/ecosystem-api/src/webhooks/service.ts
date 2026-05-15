import type { DatabaseClient } from "@lummy/db-core"
export class WebhookSubscriptionService { constructor(private readonly db: DatabaseClient) {} async subscribe(tenantId: string, endpoint: string, eventType: string) { return this.db.insert("webhook_subscriptions", { tenant_id: tenantId, endpoint, event_type: eventType, created_at: new Date().toISOString() }) } }
