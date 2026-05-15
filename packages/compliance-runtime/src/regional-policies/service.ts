import type { DatabaseClient } from "@lummy/db-core"
export class JurisdictionPolicyService { constructor(private readonly db: DatabaseClient) {} async setRule(jurisdiction: string, ruleKey: string, ruleValue: Record<string, unknown>) { return this.db.upsert("jurisdiction_rules", { jurisdiction, rule_key: ruleKey, rule_value: ruleValue, updated_at: new Date().toISOString() }) } }
