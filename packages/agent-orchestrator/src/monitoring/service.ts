export interface AgentExecutionMetric {
  agentId: string
  queue: string
  latencyMs: number
  success: boolean
  retries: number
  recordedAt: string
}

export class AgentMonitoringService {
  private readonly metrics: AgentExecutionMetric[] = []

  record(metric: AgentExecutionMetric) {
    this.metrics.push(metric)
  }

  latest(limit = 100): AgentExecutionMetric[] {
    return this.metrics.slice(-limit)
  }
}
