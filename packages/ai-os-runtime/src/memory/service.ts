import type { DatabaseClient } from "@lummy/db-core"
export class RuntimeMemoryService { constructor(private readonly db: DatabaseClient) {} async put(tenantId: string, key: string, value: Record<string, unknown>) { return this.db.upsert("ai_memories", { tenant_id: tenantId, memory_key: key, value, updated_at: new Date().toISOString() }) } }
