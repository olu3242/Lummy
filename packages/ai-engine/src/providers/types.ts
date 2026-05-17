export type AIProvider = "openai" | "anthropic" | "custom"

export interface AIExecutionInput {
  version: 1
  tenantId: string
  prompt: string
  model: string
  maxTokens: number
  temperature?: number
  metadata?: Record<string, unknown>
}

export interface AIExecutionResult {
  version: 1
  output: string
  promptTokens: number
  completionTokens: number
  finishReason: string
  raw: Record<string, unknown>
}

export interface AIProviderAdapter {
  execute(input: AIExecutionInput): Promise<AIExecutionResult>
}
