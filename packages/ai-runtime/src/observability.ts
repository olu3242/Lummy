import type { AIExecutionResult } from "./types"

export class AIOperationsDashboard {
  private readonly executions: AIExecutionResult[] = []

  add(result: AIExecutionResult) {
    this.executions.push(result)
  }

  snapshot() {
    const total = this.executions.length
    const cost = this.executions.reduce((sum, item) => sum + item.usage.estimatedCostUsd, 0)
    const latency = total ? this.executions.reduce((sum, item) => sum + item.latencyMs, 0) / total : 0
    return {
      totalExecutions: total,
      estimatedCostUsd: Number(cost.toFixed(6)),
      averageLatencyMs: Math.round(latency),
      degradedExecutions: this.executions.filter((item) => item.degraded).length,
      providerHealth: Object.fromEntries(["openai", "anthropic"].map((provider) => [provider, this.executions.filter((item) => item.provider === provider).length])),
    }
  }
}
