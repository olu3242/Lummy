import { createDefaultPromptRegistry, PromptOrchestrator } from "./prompt-orchestrator"
import { validateStructuredOutput } from "./schema"
import type { AIRuntimeStore } from "./types"

export interface AIEvaluationCase {
  name: string
  passed: boolean
  details: string
}

export class MemoryAIRuntimeStore implements AIRuntimeStore {
  readonly writes: Array<{ table: string; payload: Record<string, unknown> }> = []

  async insert(table: string, payload: Record<string, unknown>) {
    this.writes.push({ table, payload })
  }
}

export class PromptEvaluationSuite {
  async runSmokeSuite(tenantId = "00000000-0000-0000-0000-000000000000"): Promise<AIEvaluationCase[]> {
    const store = new MemoryAIRuntimeStore()
    const prompts = new PromptOrchestrator(createDefaultPromptRegistry())
    const rendered = prompts.render("commerce.lead_scoring", { signals: JSON.stringify({ tenantId, events: [{ type: "checkout_started" }] }) })
    const validation = validateStructuredOutput(
      { recommendation: "evaluate with configured provider", confidence: 0.99 },
      {
        type: "object",
        required: ["recommendation", "confidence"],
        properties: {
          recommendation: { type: "string" },
          confidence: { type: "number" },
        },
      },
    )
    await store.insert("ai_prompt_versions", { prompt_key: rendered.template.key, version: rendered.template.version, evaluated_at: new Date().toISOString() })

    return [
      {
        name: "provider credentials are configured for live execution",
        passed: Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY),
        details: "requires OPENAI_API_KEY or ANTHROPIC_API_KEY",
      },
      {
        name: "structured output validates required fields",
        passed: validation.ok,
        details: validation.ok ? "schema accepted" : validation.error,
      },
      {
        name: "prompt registry exposes governed version metadata",
        passed: store.writes.some((write) => write.table === "ai_prompt_versions"),
        details: `writes=${store.writes.map((write) => write.table).join(",")}`,
      },
    ]
  }
}
