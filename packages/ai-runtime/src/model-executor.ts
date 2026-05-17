import { AICache } from "./ai-cache"
import { AIFallbackEngine } from "./ai-fallback-engine"
import { CostGovernor } from "./cost-governor"
import { FailureHandler } from "./failure-handler"
import { InferenceTelemetry } from "./inference-telemetry"
import { PromptOrchestrator } from "./prompt-orchestrator"
import { ProviderRouter } from "./provider-router"
import { AIRateLimiter } from "./safety"
import { validateStructuredOutput } from "./schema"
import type { AIExecutionRequest, AIExecutionResult, ProviderExecutionRequest } from "./types"
import { createExecutionId, nowIso, parseJsonObject } from "./utils"

export class ModelExecutor {
  constructor(
    private readonly router: ProviderRouter,
    private readonly prompts: PromptOrchestrator,
    private readonly telemetry: InferenceTelemetry,
    private readonly fallback = new AIFallbackEngine(),
    private readonly cost = new CostGovernor(),
    private readonly failures = new FailureHandler(1),
    private readonly rateLimiter = new AIRateLimiter(),
    private readonly cache = new AICache<AIExecutionResult>(30_000)
  ) {}

  async execute<T = unknown>(request: AIExecutionRequest): Promise<AIExecutionResult<T>> {
    this.rateLimiter.assertAllowed(`${request.tenantId}:${request.workflow}`)
    this.cost.assertAllowed(request)
    const render = this.prompts.render(request.promptKey, request.variables, request.promptVersion)
    const messages = request.messages || render.messages
    const cacheKey = request.idempotencyKey ? `${request.tenantId}:${request.idempotencyKey}` : ""
    const cached = cacheKey ? this.cache.get(cacheKey) : undefined
    if (cached) return cached as AIExecutionResult<T>

    const startedAt = Date.now()
    const executionId = createExecutionId()
    const sequence = this.fallback.sequence(request.provider, request.fallbackProviders)
    const providerRequest: ProviderExecutionRequest = {
      model: request.model || "",
      messages,
      maxOutputTokens: request.maxOutputTokens || 800,
      temperature: request.temperature ?? 0.2,
      timeoutMs: request.timeoutMs || 20_000,
      responseSchema: request.responseSchema,
      metadata: request.metadata,
    }

    try {
      const executed = await this.failures.run(() => this.router.execute(sequence, providerRequest))
      const structured = parseJsonObject(executed.value.result.outputText)
      const validation = validateStructuredOutput(structured, request.responseSchema)
      if (!validation.ok) throw new Error(`AI structured output validation failed: ${validation.error}`)
      const confidence = normalizeConfidence(structured?.confidence)
      const result: AIExecutionResult<T> = {
        executionId,
        provider: executed.value.provider,
        model: executed.value.model,
        workflow: request.workflow,
        outputText: executed.value.result.outputText,
        structuredOutput: structured as T,
        confidence,
        usage: executed.value.result.usage,
        latencyMs: Date.now() - startedAt,
        retryCount: executed.retryCount,
        degraded: false,
        audit: {
          tenantId: request.tenantId,
          promptKey: render.template.key,
          promptVersion: render.template.version,
          correlationId: request.correlationId,
          idempotencyKey: request.idempotencyKey,
          providerAttempts: executed.value.attempts,
          failureReasons: executed.value.failures,
          safetyMode: "normal",
          createdAt: nowIso(),
        },
      }
      await this.telemetry.recordExecution(result)
      if (cacheKey) this.cache.set(cacheKey, result)
      return result
    } catch (error) {
      await this.telemetry.recordFailure({
        execution_id: executionId,
        tenant_id: request.tenantId,
        workflow: request.workflow,
        provider: request.provider || "auto",
        error: `${error}`,
        correlation_id: request.correlationId || null,
        created_at: nowIso(),
      })
      throw error
    }
  }
}

function normalizeConfidence(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0.5
  return Math.max(0, Math.min(1, numeric))
}
