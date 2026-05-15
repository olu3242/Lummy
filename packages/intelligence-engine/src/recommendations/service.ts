export type RecommendationContext = { tenantId: string; objective: 'growth'|'conversion'|'retention'|'efficiency'; constraints: string[]; signals: Record<string, number> };
export type Recommendation = { id: string; category: 'creator'|'campaign'|'pricing'|'funnel'|'affiliate'|'workflow'|'automation'; rationale: string; expectedImpact: number };

export function buildRecommendations(context: RecommendationContext): Recommendation[] {
  const impact = Object.values(context.signals).reduce((sum, value) => sum + value, 0) / Math.max(1, Object.keys(context.signals).length);
  return [{ id: `${context.tenantId}-${context.objective}-001`, category: 'workflow', rationale: `Optimize for ${context.objective} while honoring constraints`, expectedImpact: impact }];
}
