import { ModelExecutor } from "./model-executor"
import type { AIAuditMetadata, AIRuntimeStore, CommerceSignalInput } from "./types"

export interface CreatorCopilotSummary {
  summary: string
  hotLeads: string
  campaign: string
  confidence: number
  audit: AIAuditMetadata
}

export class CreatorCopilotService {
  constructor(private readonly executor: ModelExecutor, private readonly store?: AIRuntimeStore) {}

  async summarizeOperations(input: CommerceSignalInput): Promise<CreatorCopilotSummary> {
    const result = await this.executor.execute<Record<string, unknown>>({
      tenantId: input.tenantId,
      workflow: "creator_copilot",
      promptKey: "copilot.creator_summary",
      variables: { signals: JSON.stringify(input) },
      responseSchema: {
        type: "object",
        required: ["summary", "hotLeads", "campaign", "confidence"],
        properties: {
          summary: { type: "string" },
          hotLeads: { type: "string" },
          campaign: { type: "string" },
          confidence: { type: "number" },
        },
      },
      correlationId: input.correlationId,
    })
    const summary = {
      summary: String(result.structuredOutput?.summary || result.outputText),
      hotLeads: String(result.structuredOutput?.hotLeads || ""),
      campaign: String(result.structuredOutput?.campaign || ""),
      confidence: result.confidence,
      audit: result.audit,
    }
    await this.store?.insert("ai_commerce_insights", {
      tenant_id: input.tenantId,
      workflow: "creator_copilot",
      subject_id: input.customerId || input.tenantId,
      recommendation: summary.summary,
      confidence: summary.confidence,
      correlation_id: input.correlationId || null,
      audit_metadata: summary.audit,
    })
    return summary
  }
}
