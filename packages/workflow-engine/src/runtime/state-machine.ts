export type WorkflowDefinitionState = "draft"|"active"|"paused"|"failed"|"completed"|"cancelled"|"replaying"
export type WorkflowRunState = "queued"|"running"|"waiting_approval"|"completed"|"failed"|"compensating"|"replaying"
export type WorkflowStepState = "pending"|"queued"|"running"|"waiting_approval"|"delayed"|"retrying"|"failed"|"compensated"|"completed"
