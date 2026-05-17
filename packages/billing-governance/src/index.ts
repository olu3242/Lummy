export type PlanEntitlement = { plan: string; seats: number; aiTokenLimit: number; automationRunsLimit: number };
export type UsageMeter = { tenantId: string; aiTokens: number; automationRuns: number; seats: number };

export class SubscriptionEngine {
  constructor(private entitlements: PlanEntitlement[]) {}
  getEntitlement(plan: string) { return this.entitlements.find((p) => p.plan === plan); }
}

export class QuotaEnforcer {
  check(usage: UsageMeter, entitlement: PlanEntitlement) {
    return {
      aiTokensExceeded: usage.aiTokens > entitlement.aiTokenLimit,
      automationExceeded: usage.automationRuns > entitlement.automationRunsLimit,
      seatsExceeded: usage.seats > entitlement.seats,
    };
  }
}

export class InvoiceGenerator {
  generate(tenantId: string, amount: number, currency = 'USD') { return { tenantId, amount, currency, generatedAt: new Date().toISOString() }; }
}
