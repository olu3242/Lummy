export class SettlementsService { execute(tenantId: string, replayKey: string) { return { tenantId, replayKey, step: "settlements", queue: "commerce.orchestration" } } }
