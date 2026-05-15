export class GovernanceService { execute(tenantId: string, replayKey: string) { return { tenantId, replayKey, step: "governance", queue: "commerce.orchestration" } } }
