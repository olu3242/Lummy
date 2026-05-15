export class AdaptiveWorkflowService { adapt(workflowId: string) { return { workflowId, queue: "adaptation.optimize", tracked: true } } }
