export type AgentType = 'workflow' | 'ops' | 'commerce' | 'moderation' | 'support' | 'analytics' | 'finance' | 'automation';

export type RegisteredAgent = {
  id: string;
  tenantId: string;
  version: string;
  type: AgentType;
  capabilities: string[];
  policyIds: string[];
  permissions: string[];
  metadata: Record<string, unknown>;
};

export class AgentRegistry {
  private readonly agents = new Map<string, RegisteredAgent>();
  register(agent: RegisteredAgent): void { this.agents.set(`${agent.tenantId}:${agent.id}:${agent.version}`, agent); }
  listByTenant(tenantId: string): RegisteredAgent[] { return [...this.agents.values()].filter((a) => a.tenantId === tenantId); }
}
