export class EscalationService { route(risk: string) { return risk === "high" ? "governance.approvals" : "policy.evaluation" } }
