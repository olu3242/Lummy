import type { DatabaseClient } from "@lummy/db-core"
export class RegionalFailoverService { constructor(private readonly db: DatabaseClient) {} async trigger(fromRegion: string, toRegion: string, reason: string) { return this.db.insert("regional_failovers", { from_region: fromRegion, to_region: toRegion, reason, occurred_at: new Date().toISOString() }) } }
