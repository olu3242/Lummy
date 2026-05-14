import type { DatabaseClient } from "@lummy/db-core"
export class ExecutionControlService { constructor(private readonly db: DatabaseClient) {} async setControl(key: string, value: string) { return this.db.upsert("orchestration_controls", { control_key: key, control_value: value, updated_at: new Date().toISOString() }) } }
