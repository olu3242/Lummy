export interface AgentMemoryEntry {
  tenantId: string
  agentId: string
  key: string
  value: Record<string, unknown>
  updatedAt: string
}

export class AgentMemoryService {
  private readonly memory = new Map<string, AgentMemoryEntry>()

  private key(tenantId: string, agentId: string, key: string) {
    return `${tenantId}:${agentId}:${key}`
  }

  set(entry: AgentMemoryEntry) {
    this.memory.set(this.key(entry.tenantId, entry.agentId, entry.key), entry)
  }

  get(tenantId: string, agentId: string, key: string): AgentMemoryEntry | undefined {
    return this.memory.get(this.key(tenantId, agentId, key))
  }
}
