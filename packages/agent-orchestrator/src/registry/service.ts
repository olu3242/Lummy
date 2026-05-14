import type { AgentDefinition, AgentType } from "./types"

export class AgentRegistry {
  constructor(private readonly agents: AgentDefinition[]) {}

  byType(type: AgentType): AgentDefinition[] {
    return this.agents.filter((a) => a.type === type && a.enabled)
  }

  byId(agentId: string): AgentDefinition | undefined {
    return this.agents.find((a) => a.agentId === agentId)
  }
}
