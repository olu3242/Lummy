import type { DatabaseClient } from "@lummy/db-core"
export class ThrottlingService { constructor(private readonly db: DatabaseClient) {} async setLimit(scope: string, perMinute: number) { return this.db.upsert("runtime_throttles", { scope, per_minute: perMinute, updated_at: new Date().toISOString() }) } }
