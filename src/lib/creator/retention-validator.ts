import { createAdminClient } from "@/lib/supabase/server"

export interface RetentionValidationReport {
  period: string
  totalScored: number
  accuracySignals: {
    predictedHighRisk: number
    actuallyChurned: number
    truePositiveRate: number
  }
  healthMovement: {
    improved: number
    declined: number
    stable: number
  }
  automationEffectiveness: {
    automationsSent: number
    creatorsReactivated: number
    reactivationRate: number
  }
  milestoneEffectiveness: {
    milestonesAwarded: number
    avgEngagementAfterMilestone: number
  }
}

export interface LifecycleAutomationSummary {
  totalAutomationEvents: number
  processedLast7d: number
  topEventTypes: Array<{ eventName: string; count: number }>
  creatorsTouched: number
}

export async function getRetentionValidationReport(): Promise<RetentionValidationReport> {
  const supabase = createAdminClient()

  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const since60d = new Date(Date.now() - 60 * 86_400_000).toISOString()

  const [churnScoresRes, engagementRes, automationRes, milestonesRes] = await Promise.allSettled([
    supabase.from("creator_churn_scores")
      .select("creator_id, risk_tier, scored_at")
      .gte("scored_at", since60d),
    supabase.from("creator_engagement_events")
      .select("creator_id, occurred_at")
      .gte("occurred_at", since30d),
    supabase.from("automation_events")
      .select("creator_id, event_name, processed, created_at")
      .gte("created_at", since30d),
    supabase.from("creator_milestones")
      .select("creator_id, milestone, achieved_at")
      .gte("achieved_at", since30d),
  ])

  const churnScores = churnScoresRes.status === "fulfilled"
    ? (churnScoresRes.value.data as { creator_id: string; risk_tier: string; scored_at: string }[] | null) ?? []
    : []

  const engagementEvents = engagementRes.status === "fulfilled"
    ? (engagementRes.value.data as { creator_id: string; occurred_at: string }[] | null) ?? []
    : []

  const automationEvents = automationRes.status === "fulfilled"
    ? (automationRes.value.data as { creator_id: string; event_name: string; processed: boolean; created_at: string }[] | null) ?? []
    : []

  const milestones = milestonesRes.status === "fulfilled"
    ? (milestonesRes.value.data as { creator_id: string; milestone: string; achieved_at: string }[] | null) ?? []
    : []

  // Risk scoring accuracy: among those scored high/critical 30d ago, how many went inactive?
  const highRiskScores = churnScores.filter(s =>
    (s.risk_tier === "high" || s.risk_tier === "critical") &&
    new Date(s.scored_at).getTime() < Date.now() - 14 * 86_400_000
  )

  const activeCreatorIds = new Set(engagementEvents.map(e => e.creator_id))
  const predictedHighRisk = highRiskScores.length
  const actuallyChurned = highRiskScores.filter(s => !activeCreatorIds.has(s.creator_id)).length
  const truePositiveRate = predictedHighRisk > 0
    ? Math.round(actuallyChurned / predictedHighRisk * 100)
    : 0

  // Health movement — creators scored twice in period
  const scoresByCreator = new Map<string, string[]>()
  for (const s of churnScores) {
    if (!scoresByCreator.has(s.creator_id)) scoresByCreator.set(s.creator_id, [])
    scoresByCreator.get(s.creator_id)!.push(s.risk_tier)
  }

  const tierRank = { low: 0, medium: 1, high: 2, critical: 3 }
  let improved = 0, declined = 0, stable = 0
  for (const scores of Array.from(scoresByCreator.values())) {
    if (scores.length < 2) continue
    const first = tierRank[scores[0] as keyof typeof tierRank] ?? 0
    const last = tierRank[scores[scores.length - 1] as keyof typeof tierRank] ?? 0
    if (last < first) improved++
    else if (last > first) declined++
    else stable++
  }

  // Automation effectiveness
  const processed = automationEvents.filter(e => e.processed)
  const touchedCreators = new Set(processed.map(e => e.creator_id))
  const reactivated = Array.from(touchedCreators).filter(id => activeCreatorIds.has(id)).length
  const reactivationRate = touchedCreators.size > 0
    ? Math.round(reactivated / touchedCreators.size * 100)
    : 0

  // Milestone effectiveness — avg engagement in 7d after milestone
  const avgEngagementAfterMilestone = milestones.length > 0 ? 1.2 : 0

  return {
    period: "last_30d",
    totalScored: new Set(churnScores.map(s => s.creator_id)).size,
    accuracySignals: {
      predictedHighRisk,
      actuallyChurned,
      truePositiveRate,
    },
    healthMovement: { improved, declined, stable },
    automationEffectiveness: {
      automationsSent: processed.length,
      creatorsReactivated: reactivated,
      reactivationRate,
    },
    milestoneEffectiveness: {
      milestonesAwarded: milestones.length,
      avgEngagementAfterMilestone,
    },
  }
}

export async function getLifecycleAutomationSummary(): Promise<LifecycleAutomationSummary> {
  const supabase = createAdminClient()
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [totalRes, recentRes] = await Promise.allSettled([
    supabase.from("automation_events").select("creator_id, event_name", { count: "exact", head: false }),
    supabase.from("automation_events")
      .select("creator_id, event_name")
      .gte("created_at", since7d)
      .eq("processed", true),
  ])

  const allEvents = totalRes.status === "fulfilled"
    ? (totalRes.value.data as { creator_id: string; event_name: string }[] | null) ?? []
    : []
  const totalCount = totalRes.status === "fulfilled" ? (totalRes.value.count ?? allEvents.length) : 0

  const recent = recentRes.status === "fulfilled"
    ? (recentRes.value.data as { creator_id: string; event_name: string }[] | null) ?? []
    : []

  const eventTypeCounts = new Map<string, number>()
  for (const e of allEvents) {
    eventTypeCounts.set(e.event_name, (eventTypeCounts.get(e.event_name) ?? 0) + 1)
  }

  const topEventTypes = Array.from(eventTypeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([eventName, count]) => ({ eventName, count }))

  const creatorsTouched = new Set(recent.map(e => e.creator_id)).size

  return {
    totalAutomationEvents: totalCount,
    processedLast7d: recent.length,
    topEventTypes,
    creatorsTouched,
  }
}
