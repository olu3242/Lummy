export class DecisionApprovalService { approve(decisionId: string) { return { decisionId, queue: "decision.approvals" } } }
