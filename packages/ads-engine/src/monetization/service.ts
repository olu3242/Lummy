import type { DatabaseClient } from "@lummy/db-core"
export class MonetizationService { constructor(private readonly db: DatabaseClient) {} async bill(campaignId: string, impressionId: string, amount: number) { return this.db.insert("monetization_events", { campaign_id: campaignId, impression_id: impressionId, amount, created_at: new Date().toISOString() }) } }
