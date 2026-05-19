import { headers } from "next/headers"

const HEADER = "x-correlation-id"

export function generateCorrelationId(prefix = "req"): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now()}_${rand}`
}

export function getCorrelationId(): string {
  try {
    const hdrs = headers()
    return hdrs.get(HEADER) ?? generateCorrelationId()
  } catch {
    // Called outside request context (e.g. tests, CLI)
    return generateCorrelationId()
  }
}

export function correlationHeaders(id: string): Record<string, string> {
  return { [HEADER]: id }
}
