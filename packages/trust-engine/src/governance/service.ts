export class TrustGovernanceService { enforceVersion(current: number, proposed: number) { if (proposed < current) throw new Error("trust version rollback not allowed") } }
