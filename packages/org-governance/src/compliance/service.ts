import type { DatabaseClient } from "@lummy/db-core"
export class ComplianceRuleService { constructor(private readonly db: DatabaseClient) {} async upsert(orgId: string, ruleKey: string, value: Record<string, unknown>) { return this.db.upsert("organization_compliance_rules", { organization_id: orgId, rule_key: ruleKey, rule_value: value, updated_at: new Date().toISOString() }) } }
