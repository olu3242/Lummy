export type AutomationFlow = "abandoned_cart" | "restock_alert" | "customer_inactivity" | "review_followup" | "referral_nudge"
export interface AutomationRule { id: string; tenantId: string; enabled: boolean; flow: AutomationFlow; trigger: string; conditions: Record<string, unknown>; killSwitch?: boolean }
export class RuleService { private readonly rules: AutomationRule[] = []; listByTrigger(trigger: string) { return this.rules.filter((r) => r.enabled && !r.killSwitch && r.trigger === trigger) } register(rule: AutomationRule) { this.rules.push(rule) } }
