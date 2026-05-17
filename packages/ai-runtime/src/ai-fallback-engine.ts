import type { AIProviderName } from "./types"

export class AIFallbackEngine {
  constructor(private readonly defaultOrder: AIProviderName[] = ["openai", "anthropic"]) {}

  sequence(primary?: AIProviderName, fallbacks: AIProviderName[] = []) {
    return Array.from(new Set([primary, ...fallbacks, ...this.defaultOrder].filter(Boolean))) as AIProviderName[]
  }
}
