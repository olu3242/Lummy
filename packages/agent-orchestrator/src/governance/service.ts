import type { AgentDefinition } from "../registry/types"

export class AgentGovernanceService {
  canExecute(agent: AgentDefinition, scope: string): boolean {
    return agent.enabled && agent.permissions.includes(scope)
  }
}
