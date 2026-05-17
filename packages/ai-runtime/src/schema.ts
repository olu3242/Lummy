import type { AISchema } from "./types"

export function validateStructuredOutput(value: unknown, schema?: AISchema): { ok: true } | { ok: false; error: string } {
  if (!schema) return { ok: true }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "output is not an object" }
  const obj = value as Record<string, unknown>
  for (const key of schema.required || []) {
    if (!(key in obj)) return { ok: false, error: `missing required field: ${key}` }
  }
  for (const [key, descriptor] of Object.entries(schema.properties)) {
    if (!(key in obj) || obj[key] == null) continue
    const actual = Array.isArray(obj[key]) ? "array" : typeof obj[key]
    if (actual !== descriptor.type) return { ok: false, error: `field ${key} expected ${descriptor.type}, received ${actual}` }
  }
  return { ok: true }
}
