import type { DatabaseClient } from "@lummy/db-core"
export class SovereignStorageService { constructor(private readonly db: DatabaseClient) {} async setPolicy(country: string, policy: Record<string, unknown>) { return this.db.upsert("sovereign_policies", { country, policy, updated_at: new Date().toISOString() }) } }
