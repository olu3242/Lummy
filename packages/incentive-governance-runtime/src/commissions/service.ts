export class CommissionsService { monitor(programId: string) { return { programId, domain: "commissions", queue: "incentives.audit" } } }
