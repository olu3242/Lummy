import type { AIUsage } from "./types"

export function nowIso() {
  return new Date().toISOString()
}

export function createExecutionId(prefix = "ai") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4))
}

export function estimateUsage(inputText: string, outputText: string): AIUsage {
  const inputTokens = estimateTokens(inputText)
  const outputTokens = estimateTokens(outputText)
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCostUsd: Number(((inputTokens * 0.000002) + (outputTokens * 0.000006)).toFixed(6)),
  }
}

export function logAI(event: string, fields: Record<string, unknown> = {}) {
  console.info(JSON.stringify({ event, at: nowIso(), ...fields }))
}

export function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null
  } catch {
    const start = text.indexOf("{")
    const end = text.lastIndexOf("}")
    if (start < 0 || end <= start) return null
    try {
      const parsed = JSON.parse(text.slice(start, end + 1))
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null
    } catch {
      return null
    }
  }
}
