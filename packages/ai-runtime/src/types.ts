import type { DatabaseClient } from "@lummy/db-core"

export type AIProviderName = "openai" | "anthropic"
export type AIWorkflow =
  | "lead_scoring"
  | "conversion_prediction"
  | "product_recommendation"
  | "abandoned_order_analysis"
  | "campaign_suggestion"
  | "customer_segmentation"
  | "creator_copilot"
  | "generic"

export interface AIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface AIExecutionRequest {
  tenantId: string
  workflow: AIWorkflow
  promptKey: string
  promptVersion?: number
  provider?: AIProviderName
  fallbackProviders?: AIProviderName[]
  model?: string
  messages?: AIMessage[]
  variables?: Record<string, unknown>
  maxOutputTokens?: number
  temperature?: number
  timeoutMs?: number
  responseSchema?: AISchema
  idempotencyKey?: string
  correlationId?: string
  metadata?: Record<string, unknown>
}

export interface AIUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCostUsd: number
}

export interface AIExecutionResult<T = unknown> {
  executionId: string
  provider: AIProviderName
  model: string
  workflow: AIWorkflow
  outputText: string
  structuredOutput?: T
  confidence: number
  usage: AIUsage
  latencyMs: number
  retryCount: number
  degraded: boolean
  audit: AIAuditMetadata
}

export interface AIAuditMetadata {
  tenantId: string
  promptKey: string
  promptVersion: number
  correlationId?: string
  idempotencyKey?: string
  providerAttempts: string[]
  failureReasons: string[]
  safetyMode: "normal" | "degraded"
  createdAt: string
}

export interface AIProviderAdapter {
  name: AIProviderName
  defaultModel: string
  isConfigured(): boolean
  execute(request: ProviderExecutionRequest): Promise<ProviderExecutionResult>
}

export interface ProviderExecutionRequest {
  model: string
  messages: AIMessage[]
  maxOutputTokens: number
  temperature: number
  timeoutMs: number
  responseSchema?: AISchema
  metadata?: Record<string, unknown>
}

export interface ProviderExecutionResult {
  outputText: string
  raw: unknown
  usage: AIUsage
  finishReason?: string
}

export interface AISchema {
  type: "object"
  required?: string[]
  properties: Record<string, { type: "string" | "number" | "boolean" | "array" | "object" }>
}

export interface PromptTemplate {
  key: string
  version: number
  environment: "development" | "staging" | "production" | "all"
  approved: boolean
  system: string
  user: string
  rollbackVersion?: number
  metadata?: Record<string, unknown>
}

export interface PromptRenderResult {
  template: PromptTemplate
  messages: AIMessage[]
}

export interface AIRuntimeStore {
  db?: DatabaseClient
  insert(table: string, payload: Record<string, unknown>): Promise<void>
  upsert?(table: string, payload: Record<string, unknown>): Promise<void>
}

export interface CommerceSignalInput {
  tenantId: string
  customerId?: string
  productId?: string
  orderId?: string
  channel?: string
  events: Array<Record<string, unknown>>
  metrics?: Record<string, number>
  correlationId?: string
}

export interface CommerceIntelligenceResult {
  workflow: AIWorkflow
  subjectId: string
  recommendation: string
  confidence: number
  score?: number
  segment?: string
  audit: AIAuditMetadata
  raw: AIExecutionResult
}
