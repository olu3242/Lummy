import { emitIntelligenceTelemetry } from "../telemetry/graph-telemetry"

export type RecommendationInput = { id: string; affinityScore: number; recencyScore: number }

export class RecommendationEngine {
  rank(tenantId: string, items: RecommendationInput[]) {
    const recommendations = [...items].sort((a, b) => b.affinityScore + b.recencyScore - (a.affinityScore + a.recencyScore))
    emitIntelligenceTelemetry({ tenantId, category: "recommendation", action: "recommendation_ranked", metadata: { count: recommendations.length } })
    return recommendations
  }
}
