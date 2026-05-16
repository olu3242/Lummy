export class GovernanceService { monitor(programId: string) { return { programId, domain: "governance", queue: "incentives.audit" } } }
