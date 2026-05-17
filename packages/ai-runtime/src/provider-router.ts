import type { AIProviderAdapter, AIProviderName, ProviderExecutionRequest, ProviderExecutionResult } from "./types"
import { logAI } from "./utils"

export class ProviderRouter {
  constructor(private readonly providers: AIProviderAdapter[]) {}

  async execute(sequence: AIProviderName[], request: ProviderExecutionRequest): Promise<{ provider: AIProviderName; model: string; result: ProviderExecutionResult; attempts: string[]; failures: string[] }> {
    const attempts: string[] = []
    const failures: string[] = []
    for (const providerName of sequence) {
      const provider = this.providers.find((candidate) => candidate.name === providerName)
      if (!provider) {
        failures.push(`${providerName}: provider not registered`)
        continue
      }
      attempts.push(provider.name)
      if (!provider.isConfigured()) {
        failures.push(`${provider.name}: provider not configured`)
        logAI("ai.provider.skipped", { provider: provider.name, reason: "not_configured" })
        continue
      }
      try {
        const model = request.model || provider.defaultModel
        const result = await provider.execute({ ...request, model })
        return { provider: provider.name, model, result, attempts, failures }
      } catch (error) {
        failures.push(`${provider.name}: ${error}`)
        logAI("ai.provider.failure", { provider: provider.name, error: `${error}` })
      }
    }
    throw new Error(`All AI providers failed: ${failures.join(" | ")}`)
  }
}
