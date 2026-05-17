import type { PromptRenderResult, PromptTemplate } from "./types"

export class PromptRegistry {
  private readonly prompts = new Map<string, PromptTemplate>()

  register(prompt: PromptTemplate) {
    this.prompts.set(`${prompt.key}:v${prompt.version}`, prompt)
  }

  resolve(key: string, version?: number) {
    if (version) {
      const prompt = this.prompts.get(`${key}:v${version}`)
      if (!prompt) throw new Error(`Prompt not found: ${key}:v${version}`)
      return prompt
    }
    const candidates = Array.from(this.prompts.values())
      .filter((prompt) => prompt.key === key)
      .sort((a, b) => b.version - a.version)
    if (!candidates[0]) throw new Error(`Prompt not found: ${key}`)
    return candidates[0]
  }

  list() {
    return Array.from(this.prompts.values()).sort((a, b) => a.key.localeCompare(b.key) || b.version - a.version)
  }
}

export class PromptOrchestrator {
  constructor(private readonly registry: PromptRegistry, private readonly environment = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development") {}

  render(key: string, variables: Record<string, unknown> = {}, version?: number): PromptRenderResult {
    const template = this.registry.resolve(key, version)
    if (!template.approved) throw new Error(`Prompt is not approved: ${key}:v${template.version}`)
    if (template.environment !== "all" && template.environment !== this.environment) {
      throw new Error(`Prompt ${key}:v${template.version} is not enabled for ${this.environment}`)
    }
    return {
      template,
      messages: [
        { role: "system", content: renderTemplate(template.system, variables) },
        { role: "user", content: renderTemplate(template.user, variables) },
      ],
    }
  }
}

function renderTemplate(template: string, variables: Record<string, unknown>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, key: string) => {
    const value = key.split(".").reduce<unknown>((current, part) => current && typeof current === "object" ? (current as Record<string, unknown>)[part] : undefined, variables)
    return value == null ? "" : String(value)
  })
}

export function createDefaultPromptRegistry() {
  const registry = new PromptRegistry()
  const baseSystem = "You are Lummy's governed commerce intelligence assistant. Return concise, auditable JSON only. Include confidence between 0 and 1."
  const prompts: PromptTemplate[] = [
    { key: "commerce.lead_scoring", version: 1, environment: "all", approved: true, system: baseSystem, user: "Score this lead from operational signals: {{signals}}. Return {\"score\":number,\"recommendation\":string,\"confidence\":number}." },
    { key: "commerce.conversion_prediction", version: 1, environment: "all", approved: true, system: baseSystem, user: "Predict conversion likelihood from signals: {{signals}}. Return {\"score\":number,\"recommendation\":string,\"confidence\":number}." },
    { key: "commerce.product_recommendation", version: 1, environment: "all", approved: true, system: baseSystem, user: "Recommend products from customer and catalog signals: {{signals}}. Return {\"recommendation\":string,\"confidence\":number}." },
    { key: "commerce.abandoned_order_analysis", version: 1, environment: "all", approved: true, system: baseSystem, user: "Analyze this abandoned order and suggest recovery: {{signals}}. Return {\"recommendation\":string,\"confidence\":number}." },
    { key: "commerce.campaign_suggestion", version: 1, environment: "all", approved: true, system: baseSystem, user: "Suggest a campaign from commerce signals: {{signals}}. Return {\"recommendation\":string,\"confidence\":number}." },
    { key: "commerce.customer_segmentation", version: 1, environment: "all", approved: true, system: baseSystem, user: "Segment this customer from signals: {{signals}}. Return {\"segment\":string,\"recommendation\":string,\"confidence\":number}." },
    { key: "copilot.creator_summary", version: 1, environment: "all", approved: true, system: baseSystem, user: "Summarize creator operations and recommend next actions: {{signals}}. Return {\"summary\":string,\"hotLeads\":string,\"campaign\":string,\"confidence\":number}." },
  ]
  for (const prompt of prompts) registry.register(prompt)
  return registry
}
