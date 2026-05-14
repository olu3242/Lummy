export class AgentIsolationService { isolate(tenantId: string, agentId: string) { return `${tenantId}:${agentId}` } }
