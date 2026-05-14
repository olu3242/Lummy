export class NegotiationsService { execute(tenantId: string, replayKey: string) { return { tenantId, replayKey, step: "negotiations", queue: "commerce.orchestration" } } }
