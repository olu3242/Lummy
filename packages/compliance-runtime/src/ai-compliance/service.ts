import type { DatabaseClient } from "@lummy/db-core"
export class AIComplianceService { constructor(private readonly db: DatabaseClient) {} async setPolicy(jurisdiction: string, provider: string, maxTokens: number) { return this.db.upsert("ai_compliance_policies", { jurisdiction, provider, max_tokens: maxTokens, updated_at: new Date().toISOString() }) } }
