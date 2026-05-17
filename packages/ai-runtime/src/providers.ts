import type { AIProviderAdapter, ProviderExecutionRequest, ProviderExecutionResult } from "./types"
import { estimateUsage } from "./utils"

export class OpenAIProvider implements AIProviderAdapter {
  name = "openai" as const
  defaultModel = process.env.OPENAI_MODEL || "gpt-4o-mini"

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY)
  }

  async execute(request: ProviderExecutionRequest): Promise<ProviderExecutionResult> {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured")
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), request.timeoutMs)
    try {
      const input = request.messages.map((message) => `${message.role}: ${message.content}`).join("\n")
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: request.model,
          input,
          max_output_tokens: request.maxOutputTokens,
          temperature: request.temperature,
        }),
      })
      if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`)
      const raw = await response.json() as Record<string, unknown>
      const outputText = extractOpenAIText(raw)
      return { outputText, raw, usage: extractUsage(raw, input, outputText), finishReason: String(raw.status || "unknown") }
    } finally {
      clearTimeout(timer)
    }
  }
}

export class AnthropicProvider implements AIProviderAdapter {
  name = "anthropic" as const
  defaultModel = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest"

  isConfigured() {
    return Boolean(process.env.ANTHROPIC_API_KEY)
  }

  async execute(request: ProviderExecutionRequest): Promise<ProviderExecutionResult> {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured")
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), request.timeoutMs)
    try {
      const system = request.messages.find((message) => message.role === "system")?.content
      const messages = request.messages.filter((message) => message.role !== "system")
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: request.model,
          system,
          messages,
          max_tokens: request.maxOutputTokens,
          temperature: request.temperature,
        }),
      })
      if (!response.ok) throw new Error(`Anthropic request failed: ${response.status}`)
      const raw = await response.json() as Record<string, unknown>
      const outputText = extractAnthropicText(raw)
      return { outputText, raw, usage: extractUsage(raw, JSON.stringify(request.messages), outputText), finishReason: String(raw.stop_reason || "unknown") }
    } finally {
      clearTimeout(timer)
    }
  }
}

function extractOpenAIText(raw: Record<string, unknown>) {
  if (typeof raw.output_text === "string") return raw.output_text
  const output = Array.isArray(raw.output) ? raw.output : []
  const chunks: string[] = []
  for (const item of output) {
    const content = item && typeof item === "object" ? (item as Record<string, unknown>).content : undefined
    if (!Array.isArray(content)) continue
    for (const part of content) {
      if (part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string") chunks.push((part as Record<string, unknown>).text as string)
    }
  }
  return chunks.join("\n")
}

function extractAnthropicText(raw: Record<string, unknown>) {
  const content = Array.isArray(raw.content) ? raw.content : []
  return content.map((part) => part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string" ? (part as Record<string, unknown>).text : "").filter(Boolean).join("\n")
}

function extractUsage(raw: Record<string, unknown>, inputText: string, outputText: string) {
  const usage = raw.usage && typeof raw.usage === "object" ? raw.usage as Record<string, unknown> : {}
  const estimated = estimateUsage(inputText, outputText)
  const inputTokens = Number(usage.input_tokens || usage.prompt_tokens || estimated.inputTokens)
  const outputTokens = Number(usage.output_tokens || usage.completion_tokens || estimated.outputTokens)
  return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, estimatedCostUsd: estimated.estimatedCostUsd }
}
