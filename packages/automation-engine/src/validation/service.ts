import type { AutomationRule } from "../rules/service"
export class ValidationService { validate(rule: AutomationRule) { if (!rule.tenantId || !rule.id) throw new Error("invalid rule") } }
