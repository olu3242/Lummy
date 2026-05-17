import type { AIExecutionRequest } from "./types"

export class CostGovernor {
  private readonly usageByTenant = new Map<string, { windowStartedAt: number; tokens: number }>()

  constructor(private readonly maxTokensPerRequest = 4000, private readonly maxTokensPerTenantWindow = 100_000, private readonly windowMs = 60 * 60 * 1000) {}

  assertAllowed(request: AIExecutionRequest) {
    const requested = request.maxOutputTokens || 800
    if (requested > this.maxTokensPerRequest) throw new Error(`AI token budget exceeded: ${requested} > ${this.maxTokensPerRequest}`)
    const current = this.usageByTenant.get(request.tenantId)
    if (!current || current.windowStartedAt + this.windowMs < Date.now()) {
      this.usageByTenant.set(request.tenantId, { windowStartedAt: Date.now(), tokens: requested })
      return
    }
    if (current.tokens + requested > this.maxTokensPerTenantWindow) throw new Error("AI tenant quota exceeded")
    current.tokens += requested
  }
}
