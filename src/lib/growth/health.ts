import { createAdminClient } from "@/lib/supabase/server"
import { computeCreatorScore, upsertHealthScore } from "./scoring"
import { dispatchAutomation } from "@/lib/automation/triggers"
import { logger } from "@/lib/observability/logger"

export interface CreatorHealthSummary {
  totalScored: number
  healthy: number
  atRisk: number
  churned: number
  avgScore: number
}

/**
 * Recompute health scores for all active creators.
 * Designed to run as a daily job — idempotent and safe to repeat.
 */
export async function recomputeAllHealthScores(): Promise<CreatorHealthSummary> {
  const supabase = createAdminClient()

  const { data: creators } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("is_active", true)
    .limit(500)

  if (!creators?.length) return { totalScored: 0, healthy: 0, atRisk: 0, churned: 0, avgScore: 0 }

  let healthy = 0, atRisk = 0, churned = 0, totalScore = 0

  for (const { id } of creators as { id: string }[]) {
    try {
      const score = await computeCreatorScore(id)
      await upsertHealthScore(score)

      if (score.riskLevel === "healthy") healthy++
      else if (score.riskLevel === "at_risk") atRisk++
      else churned++

      totalScore += score.overallScore

      // Trigger automations for at-risk creators
      if (score.riskLevel === "churned") {
        dispatchAutomation({
          name: "creator_inactive_30d",
          creatorId: id,
          payload: { score: score.overallScore },
          idempotencyKey: `inactive_30d:${id}:${new Date().toISOString().slice(0, 10)}`,
        })
      } else if (score.riskLevel === "at_risk") {
        dispatchAutomation({
          name: "creator_inactive_7d",
          creatorId: id,
          payload: { score: score.overallScore },
          idempotencyKey: `inactive_7d:${id}:${new Date().toISOString().slice(0, 10)}`,
        })
      }
    } catch (err) {
      logger.warn("[health] failed to score creator", { creatorId: id, error: String(err) })
    }
  }

  const total = creators.length
  return {
    totalScored: total,
    healthy,
    atRisk,
    churned,
    avgScore: total > 0 ? Math.round(totalScore / total) : 0,
  }
}

export async function getHealthDistribution(): Promise<CreatorHealthSummary | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("creator_health_scores")
      .select("overall_score, risk_level")

    if (!data) return null

    const rows = data as { overall_score: number; risk_level: string }[]
    const total = rows.length
    const healthy = rows.filter(r => r.risk_level === "healthy").length
    const atRisk  = rows.filter(r => r.risk_level === "at_risk").length
    const churned = rows.filter(r => r.risk_level === "churned").length
    const avgScore = total > 0 ? Math.round(rows.reduce((s, r) => s + r.overall_score, 0) / total) : 0

    return { totalScored: total, healthy, atRisk, churned, avgScore }
  } catch {
    return null
  }
}
