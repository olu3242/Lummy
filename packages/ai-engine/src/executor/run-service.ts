import type { DatabaseClient } from "@lummy/db-core"
import { GovernanceService } from "../governance/service"
import { PromptRegistry } from "../prompts/registry"
import { ProviderRouter } from "../providers/router"

export class AiRunService {
  constructor(private readonly db: DatabaseClient, private readonly governance: GovernanceService, private readonly prompts: PromptRegistry, private readonly providers: ProviderRouter) {}
  async execute(input: { tenantId: string; runId: string; promptKey: string; promptVersion: number; provider: string; fallbackProvider?: string; maxTokens: number }) {
    const correlationId = `ai-run:${input.runId}`
    const template = this.prompts.resolve(input.promptKey, input.promptVersion)
    this.governance.requireApproval(template.approved)
    this.governance.enforceTokenBudget(input.maxTokens, template.maxTokens)
    const result = await this.providers.execute(input.provider, input.fallbackProvider || null, { version: 1, tenantId: input.tenantId, prompt: template.content, model: "default", maxTokens: input.maxTokens, metadata: { correlationId, runId: input.runId } })
    if (result.version !== 1) throw new Error(`Unsupported AI execution result version: ${result.version}`)
    await this.db.insert("ai_runs", { run_id: input.runId, tenant_id: input.tenantId, prompt_key: input.promptKey, prompt_version: input.promptVersion, provider: input.provider, output: result.output, prompt_tokens: result.promptTokens, completion_tokens: result.completionTokens, created_at: new Date().toISOString() })
    console.info(JSON.stringify({ event: "ai.run.completed", runId: input.runId, tenantId: input.tenantId, correlationId, provider: input.provider, fallbackProvider: input.fallbackProvider || null, promptTokens: result.promptTokens, completionTokens: result.completionTokens, finishReason: result.finishReason }))
    return result
  }
}
