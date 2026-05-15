import type { AIExecutionInput, AIExecutionResult, AIProviderAdapter } from "./types"

interface ProviderChaosControls {
  shouldFail?(scenario: "provider.outage" | "provider.timeout" | "provider.malformed" | "provider.quota", provider: string): boolean
}

export class ProviderRouter {
  constructor(private readonly providers: Record<string, AIProviderAdapter>, private readonly chaos?: ProviderChaosControls) {}

  async execute(primary: string, fallback: string | null, input: AIExecutionInput): Promise<AIExecutionResult> {
    const providers = [primary, fallback].filter(Boolean) as string[]
    const errors: string[] = []

    for (const provider of providers) {
      const startedAt = Date.now()
      if (this.chaos?.shouldFail?.("provider.outage", provider)) {
        errors.push(`${provider}: CHAOS_PROVIDER_OUTAGE`)
        console.warn(JSON.stringify({ event: "ai.provider.outage", provider, tenantId: input.tenantId, correlationId: input.metadata?.correlationId }))
        continue
      }

      try {
        const result = await this.providers[provider].execute(input)
        if (this.chaos?.shouldFail?.("provider.malformed", provider)) throw new Error("CHAOS_PROVIDER_MALFORMED")
        console.info(JSON.stringify({ event: "ai.provider.success", provider, tenantId: input.tenantId, correlationId: input.metadata?.correlationId, latencyMs: Date.now() - startedAt, promptTokens: result.promptTokens, completionTokens: result.completionTokens }))
        return result
      } catch (error) {
        console.error(JSON.stringify({ event: "ai.provider.error", provider, tenantId: input.tenantId, correlationId: input.metadata?.correlationId, latencyMs: Date.now() - startedAt, error: `${error}` }))
        errors.push(`${provider}: ${error}`)
      }
    }

    throw new Error(`provider execution failed: ${errors.join(" | ")}`)
  }
}
