export class WorkflowCompensationService { compensate(runId: string, chain: string[]){ return { runId, chain, status: "compensated" as const } } }
