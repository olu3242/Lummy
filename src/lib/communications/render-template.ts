export type TemplateVariables = Record<string, string | number | boolean | null | undefined>

export interface RenderTemplateInput {
  subject: string
  previewText: string
  html: string
  variables: TemplateVariables
  fallbacks?: TemplateVariables
}

export interface RenderedTemplate {
  subject: string
  previewText: string
  html: string
  missingVariables: string[]
  usedVariables: string[]
  valid: boolean
}

const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_]+)\s*}}/g

export function extractPlaceholders(value: string): string[] {
  const names = new Set<string>()
  for (const match of value.matchAll(VARIABLE_PATTERN)) {
    if (match[1]) names.add(match[1])
  }
  return Array.from(names).sort()
}

export function getTemplatePlaceholders(input: Pick<RenderTemplateInput, "subject" | "previewText" | "html">): string[] {
  return Array.from(new Set([
    ...extractPlaceholders(input.subject),
    ...extractPlaceholders(input.previewText),
    ...extractPlaceholders(input.html),
  ])).sort()
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function normalizeValue(value: TemplateVariables[string]): string | null {
  if (value === null || value === undefined || value === "") return null
  return String(value)
}

export function validateVariables(requiredVariables: string[], variables: TemplateVariables, fallbacks: TemplateVariables = {}) {
  return requiredVariables.filter((name) => normalizeValue(variables[name]) === null && normalizeValue(fallbacks[name]) === null)
}

function renderString(value: string, variables: TemplateVariables, fallbacks: TemplateVariables, escape: boolean) {
  return value.replace(VARIABLE_PATTERN, (_, rawName: string) => {
    const resolved = normalizeValue(variables[rawName]) ?? normalizeValue(fallbacks[rawName]) ?? ""
    return escape ? escapeHtml(resolved) : resolved
  })
}

export function renderTemplateContent(input: RenderTemplateInput): RenderedTemplate {
  const fallbacks = input.fallbacks ?? {}
  const usedVariables = getTemplatePlaceholders(input)
  const missingVariables = validateVariables(usedVariables, input.variables, fallbacks)

  return {
    subject: renderString(input.subject, input.variables, fallbacks, false),
    previewText: renderString(input.previewText, input.variables, fallbacks, false),
    html: renderString(input.html, input.variables, fallbacks, true),
    missingVariables,
    usedVariables,
    valid: missingVariables.length === 0,
  }
}
