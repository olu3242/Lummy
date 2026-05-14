import type { DatabaseClient } from "@lummy/db-core"
export class RuntimeControlService { constructor(private readonly db: DatabaseClient) {} async set(orgId: string, key: string, value: number) { return this.db.upsert("organization_runtime_controls", { organization_id: orgId, control_key: key, control_value: value, updated_at: new Date().toISOString() }) } }
