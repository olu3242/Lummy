export class WorkflowApprovalService {
 requestApproval(runId: string, stepId: string){ return { runId, stepId, state: "pending" as const } }
 escalateApproval(runId: string, stepId: string){ return { runId, stepId, escalated: true } }
 timeoutApproval(runId: string, stepId: string){ return { runId, stepId, timedOut: true } }
 delegateApproval(runId: string, stepId: string, approverId: string){ return { runId, stepId, approverId } }
 rejectApproval(runId: string, stepId: string, reason: string){ return { runId, stepId, reason, state: "rejected" as const } }
 approve(runId: string, approverId: string){ return { runId, approverId, approvedAt: new Date().toISOString() } }
}
