export class WorkflowContinuityService { preserve(workflowId: string) { return { workflowId, crossSession: true } } }
