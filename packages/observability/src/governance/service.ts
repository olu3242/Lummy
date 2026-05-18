export class ObservabilityGovernanceService { enforceAccess(authorized: boolean) { if (!authorized) throw new Error("observability access denied") } }
