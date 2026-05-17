import type { AIExecutionResult, AIRuntimeStore } from "./types"
import { logAI } from "./utils"

export class InferenceTelemetry {
  constructor(private readonly store?: AIRuntimeStore) {}

  async recordExecution(result: AIExecutionResult) {
    logAI("ai.execution.completed", {
      executionId: result.executionId,
      tenantId: result.audit.tenantId,
      workflow: result.workflow,
      provider: result.provider,
      latencyMs: result.latencyMs,
      totalTokens: result.usage.totalTokens,
      estimatedCostUsd: result.usage.estimatedCostUsd,
      degraded: result.degraded,
    })
    await this.store?.insert("ai_execution_logs", {
      execution_id: result.executionId,
      tenant_id: result.audit.tenantId,
      workflow: result.workflow,
      provider: result.provider,
      model: result.model,
      prompt_key: result.audit.promptKey,
      prompt_version: result.audit.promptVersion,
      latency_ms: result.latencyMs,
      input_tokens: result.usage.inputTokens,
      output_tokens: result.usage.outputTokens,
      estimated_cost_usd: result.usage.estimatedCostUsd,
      confidence: result.confidence,
      degraded: result.degraded,
      correlation_id: result.audit.correlationId || null,
      audit_metadata: result.audit,
    })
    await this.store?.insert("ai_usage_metrics", {
      tenant_id: result.audit.tenantId,
      workflow: result.workflow,
      provider: result.provider,
      total_tokens: result.usage.totalTokens,
      estimated_cost_usd: result.usage.estimatedCostUsd,
      latency_ms: result.latencyMs,
      created_at: new Date().toISOString(),
    })
  }

  async recordFailure(fields: Record<string, unknown>) {
    logAI("ai.execution.failure", fields)
    await this.store?.insert("ai_provider_failures", fields)
  }
}
