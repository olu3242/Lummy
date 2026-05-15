export class CoordinationService { lockKey(tenantId: string, runId: string) { return `${tenantId}:${runId}` } }
