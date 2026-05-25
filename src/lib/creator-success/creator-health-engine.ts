/**
 * Creator Health Engine — orchestrates health scoring, trend detection,
 * and health-based event emission.
 *
 * Wraps existing growth/scoring.ts and adds trend detection + event emission.
 */

import { computeCreatorScore, upsertHealthScore } from "@/lib/growth/scoring"
import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"

export interface CreatorHealthSnapshot {
  creatorId: string
  overallScore: number
  activationScore: number
  engagementScore: number
  storefrontScore: number
  riskLevel: "healthy" | "at_risk" | "churned"
  trend: "improving" | "stable" | "declining"
}

export async function computeAndEmitCreatorHealth(creatorId: string): Promise<CreatorHealthSnapshot> {
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("cse")

  const score = await computeCreatorScore(creatorId)
  await upsertHealthScore(score)

  // Get previous snapshot for trend detection
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]
  const { data: prevSnap } = await supabase
    .from("creator_performance_snapshots")
    .select("health_score")
    .eq("creator_id", creatorId)
    .lte("snapshot_date", sevenDaysAgo)
    .not("health_score", "is", null)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  const prevScore = (prevSnap as { health_score: number } | null)?.health_score
  let trend: CreatorHealthSnapshot["trend"] = "stable"
  if (prevScore !== undefined && prevScore !== null) {
    const delta = score.overallScore - prevScore
    if (delta >= 10) trend = "improving"
    else if (delta <= -10) trend = "declining"
  }

  // Emit health event if declining significantly
  if (trend === "declining" && prevScore && (prevScore - score.overallScore) >= 15) {
    const today = new Date().toISOString().split("T")[0]
    void emitEvent("creator_health_degraded", { tenantId: creatorId, creatorId, correlationId }, {
      previousScore: prevScore,
      currentScore: score.overallScore,
      dropPct: ((prevScore - score.overallScore) / prevScore) * 100,
      riskLevel: score.riskLevel,
      trend,
    }, `creator_health_degraded:${creatorId}:${today}`).catch(() => {})
  }

  return {
    creatorId,
    overallScore:    score.overallScore,
    activationScore: score.activationScore,
    engagementScore: score.engagementScore,
    storefrontScore: score.storefrontScore,
    riskLevel:       score.riskLevel,
    trend,
  }
}

export async function batchComputeCreatorHealth(limit = 200): Promise<{
  computed: number; degraded: number; improved: number
}> {
  const supabase = createAdminClient()
  const { data: creators } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("is_published", true)
    .limit(limit)

  let computed = 0, degraded = 0, improved = 0
  for (const c of (creators ?? []) as { id: string }[]) {
    try {
      const snap = await computeAndEmitCreatorHealth(c.id)
      computed++
      if (snap.trend === "declining") degraded++
      else if (snap.trend === "improving") improved++
    } catch (err) {
      logger.warn("[creator-health-engine] failed for creator", { creatorId: c.id, error: String(err) })
    }
  }

  return { computed, degraded, improved }
}
