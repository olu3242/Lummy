export class ApprovalsService { execute(tenantId: string, replayKey: string) { return { tenantId, replayKey, step: "approvals", queue: "commerce.orchestration" } } }
