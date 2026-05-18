export class FraudService { monitor(programId: string) { return { programId, domain: "fraud", queue: "incentives.audit" } } }
