import { ModelExecutor } from "./model-executor"
import type { AIRuntimeStore, AIWorkflow, CommerceIntelligenceResult, CommerceSignalInput } from "./types"

const commerceSchema = {
  type: "object" as const,
  required: ["recommendation", "confidence"],
  properties: {
    score: { type: "number" as const },
    segment: { type: "string" as const },
    recommendation: { type: "string" as const },
    confidence: { type: "number" as const },
  },
}

export class CommerceIntelligenceService {
  constructor(private readonly executor: ModelExecutor, private readonly store?: AIRuntimeStore) {}

  leadScoring(input: CommerceSignalInput) {
    return this.run("lead_scoring", "commerce.lead_scoring", input)
  }

  conversionPrediction(input: CommerceSignalInput) {
    return this.run("conversion_prediction", "commerce.conversion_prediction", input)
  }

  productRecommendation(input: CommerceSignalInput) {
    return this.run("product_recommendation", "commerce.product_recommendation", input)
  }

  abandonedOrderAnalysis(input: CommerceSignalInput) {
    return this.run("abandoned_order_analysis", "commerce.abandoned_order_analysis", input)
  }

  campaignSuggestions(input: CommerceSignalInput) {
    return this.run("campaign_suggestion", "commerce.campaign_suggestion", input)
  }

  customerSegmentation(input: CommerceSignalInput) {
    return this.run("customer_segmentation", "commerce.customer_segmentation", input)
  }

  private async run(workflow: AIWorkflow, promptKey: string, input: CommerceSignalInput): Promise<CommerceIntelligenceResult> {
    const raw = await this.executor.execute<Record<string, unknown>>({
      tenantId: input.tenantId,
      workflow,
      promptKey,
      variables: { signals: JSON.stringify(input) },
      responseSchema: commerceSchema,
      correlationId: input.correlationId,
      metadata: { customerId: input.customerId, productId: input.productId, orderId: input.orderId },
    })
    const structured = raw.structuredOutput || {}
    const result = {
      workflow,
      subjectId: input.customerId || input.orderId || input.productId || input.tenantId,
      recommendation: String(structured.recommendation || raw.outputText),
      confidence: raw.confidence,
      score: typeof structured.score === "number" ? structured.score : undefined,
      segment: typeof structured.segment === "string" ? structured.segment : undefined,
      audit: raw.audit,
      raw,
    }
    await this.store?.insert("ai_commerce_insights", {
      tenant_id: input.tenantId,
      workflow,
      subject_id: result.subjectId,
      recommendation: result.recommendation,
      confidence: result.confidence,
      score: result.score ?? null,
      segment: result.segment ?? null,
      correlation_id: input.correlationId || null,
      audit_metadata: result.audit,
    })
    return result
  }
}
