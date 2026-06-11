import type { ActionRecommendation } from "@/lib/ai/recommendations"
import type { RetentionSignals } from "@/lib/growth/retention"
import { getCreatorRecommendations } from "@/lib/ai/recommendations"
import { getCreatorRetentionSignals } from "@/lib/growth/retention"
import type { ChurnRiskScore } from "@/lib/creator/churn"
import type { RevenueOpportunity } from "@/lib/revenue/intelligence"

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const

export type RecommendationSeverity = "critical" | "high" | "medium" | "low"

export interface RankedRecommendation extends ActionRecommendation {
  severity: RecommendationSeverity
  rank: number
}

export function rankRecommendations(recs: ActionRecommendation[]): RankedRecommendation[] {
  return recs
    .map((rec, idx) => ({
      ...rec,
      severity: rec.priority === "high" ? "high" : rec.priority === "medium" ? "medium" : "low" as RecommendationSeverity,
      rank: PRIORITY_RANK[rec.priority] * 100 + idx,
    }))
    .sort((a, b) => a.rank - b.rank)
}

export function deduplicateRecommendations(
  recs: ActionRecommendation[],
  maxPerCategory = 1,
): ActionRecommendation[] {
  const seen = new Map<string, number>()
  return recs.filter(rec => {
    const count = seen.get(rec.category) ?? 0
    if (count >= maxPerCategory) return false
    seen.set(rec.category, count + 1)
    return true
  })
}

export function injectChurnRecommendation(
  recs: ActionRecommendation[],
  churn: ChurnRiskScore,
): ActionRecommendation[] {
  if (churn.riskTier === "low") return recs

  const urgencyMap = {
    critical: { priority: "high" as const, prefix: "Urgent: " },
    high:     { priority: "high" as const, prefix: "Action needed: " },
    medium:   { priority: "medium" as const, prefix: "" },
  } as const

  const cfg = urgencyMap[churn.riskTier as keyof typeof urgencyMap]
  if (!cfg) return recs

  const churnRec: ActionRecommendation = {
    id: "churn_recovery",
    priority: cfg.priority,
    category: "engagement",
    title: `${cfg.prefix}${churn.recommendedAction}`,
    description: churn.signals.slice(0, 2).join(" · "),
    ctaLabel: "View growth tips",
    ctaUrl: "/dashboard/insights",
    estimatedImpact: "Prevent store decline",
  }

  return [churnRec, ...recs.filter(r => r.id !== "churn_recovery")]
}

export function injectOpportunityRecommendations(
  recs: ActionRecommendation[],
  opps: RevenueOpportunity[],
): ActionRecommendation[] {
  const highOpps = opps.filter(o => o.priority === "high").slice(0, 2)
  const oppRecs: ActionRecommendation[] = highOpps.map(opp => ({
    id: `opp_${opp.type}`,
    priority: "medium" as const,
    category: "marketing" as const,
    title: opp.title,
    description: `${opp.description} ${opp.estimatedUplift}`,
    ctaLabel: "Take action",
    ctaUrl: "/dashboard/store",
    estimatedImpact: opp.estimatedUplift,
  }))

  return deduplicateRecommendations([...recs, ...oppRecs], 2)
}

export async function buildCreatorRecommendationSummary(
  creatorId: string,
  opts: { churn?: ChurnRiskScore; opportunities?: RevenueOpportunity[] } = {},
): Promise<{ recommendations: RankedRecommendation[]; topAction: RankedRecommendation | null; hasUrgent: boolean }> {
  const signals: RetentionSignals = await getCreatorRetentionSignals(creatorId)

  let recs = getCreatorRecommendations(signals)

  if (opts.churn) {
    recs = injectChurnRecommendation(recs, opts.churn)
  }
  if (opts.opportunities) {
    recs = injectOpportunityRecommendations(recs, opts.opportunities)
  }

  const ranked = rankRecommendations(deduplicateRecommendations(recs, 2)).slice(0, 5)

  return {
    recommendations: ranked,
    topAction: ranked[0] ?? null,
    hasUrgent: ranked.some(r => r.severity === "critical" || r.severity === "high"),
  }
}
