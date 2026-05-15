export class WorkflowsService { execute(tenantId: string, replayKey: string) { return { tenantId, replayKey, step: "workflows", queue: "commerce.orchestration" } } }
