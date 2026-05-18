export class OrchestrationService { execute(tenantId: string, replayKey: string) { return { tenantId, replayKey, step: "orchestration", queue: "commerce.orchestration" } } }
