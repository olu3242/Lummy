export class RecoveryService { execute(tenantId: string, replayKey: string) { return { tenantId, replayKey, step: "recovery", queue: "commerce.orchestration" } } }
