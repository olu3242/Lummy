/**
 * Creator Coordinator — unified orchestration point that combines health,
 * risk, growth, and lifecycle signals into a single coordination plan.
 *
 * This is the top-level orchestrator for per-creator intelligence.
 * It calls into existing engines and coordinates their outputs into
 * actionable events — without duplicating any engine logic.
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"

export interface CreatorCoordinationPlan {
  creatorId: string
  urgency: "immediate" | "today" | "this_week" | "routine"
  primarySignal: string
  actions: string[]
  monetizationOpportunity: boolean
  retentionRisk: boolean
  growthMomentum: boolean
}

// ── Creator Influence Scoring ─────────────────────────────────────────────────

export interface CreatorInfluenceScore {
  creatorId: string
  score: number       // 0-100
  tier: "standard" | "growing" | "influential" | "top"
  signals: string[]
}

export async function computeCreatorInfluenceScore(creatorId: string): Promise<CreatorInfluenceScore> {
  const supabase = createAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]

  const [metricsRes, ordersRes, healthRes] = await Promise.allSettled([
    supabase.from("creator_metrics_daily")
      .select("storefront_views, whatsapp_clicks, orders_created")
      .eq("creator_id", creatorId)
      .gte("date", thirtyDaysAgo)
      .limit(30),
    supabase.from("orders")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .eq("status", "completed"),
    supabase.from("creator_health_scores")
      .select("overall_score")
      .eq("creator_id", creatorId)
      .maybeSingle(),
  ])

  const metrics = metricsRes.status === "fulfilled" ? (metricsRes.value.data ?? []) as { storefront_views: number; whatsapp_clicks: number; orders_created: number }[] : []
  const totalOrders = ordersRes.status === "fulfilled" ? (ordersRes.value.count ?? 0) : 0
  const healthScore = healthRes.status === "fulfilled" ? ((healthRes.value.data as { overall_score: number } | null)?.overall_score ?? 0) : 0

  const totalViews = metrics.reduce((s, r) => s + r.storefront_views, 0)
  const totalWA    = metrics.reduce((s, r) => s + r.whatsapp_clicks, 0)

  const signals: string[] = []
  let score = 0

  // Revenue influence: 40 pts
  const revenueScore = Math.min(40, totalOrders * 2)
  score += revenueScore
  if (revenueScore >= 30) signals.push("high_order_volume")

  // Engagement influence: 30 pts
  const engagementScore = Math.min(30, Math.round((totalViews / 100) + (totalWA / 20)))
  score += engagementScore
  if (totalViews >= 500) signals.push("high_storefront_traffic")

  // Health influence: 30 pts
  const healthInfluence = Math.round(healthScore * 0.3)
  score += healthInfluence
  if (healthScore >= 80) signals.push("healthy_store")

  score = Math.min(100, score)

  const tier: CreatorInfluenceScore["tier"] =
    score >= 80 ? "top" :
    score >= 60 ? "influential" :
    score >= 30 ? "growing" :
    "standard"

  return { creatorId, score, tier, signals }
}

// ── Batch Influence Detection ─────────────────────────────────────────────────

export async function detectHighInfluenceCreators(limit = 100): Promise<{
  detected: number; topCreators: string[]
}> {
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("coord")
  const today = new Date().toISOString().split("T")[0]

  // Get creators with recent high order volume
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const { data: topCreators } = await supabase
    .from("creator_performance_snapshots")
    .select("creator_id, order_count, revenue_kobo, health_score")
    .gte("snapshot_date", new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0])
    .order("revenue_kobo", { ascending: false })
    .limit(limit)

  const highInfluenceIds: string[] = []

  for (const c of (topCreators ?? []) as { creator_id: string; order_count: number; revenue_kobo: number; health_score: number | null }[]) {
    const isHighInfluence = c.order_count >= 10 || c.revenue_kobo >= 100_000_00  // ₦100k+
    if (isHighInfluence) {
      highInfluenceIds.push(c.creator_id)
      await emitEvent("creator_high_influence_detected", {
        tenantId: c.creator_id,
        creatorId: c.creator_id,
        correlationId,
      }, {
        orderCount:    c.order_count,
        revenueKobo:   c.revenue_kobo,
        healthScore:   c.health_score,
        detectedDate:  today,
      }, `creator_high_influence:${c.creator_id}:${today}`)
    }
  }

  return { detected: highInfluenceIds.length, topCreators: highInfluenceIds }
}

// ── Unified Creator Coordination Plan ────────────────────────────────────────

export async function buildCreatorCoordinationPlan(
  creatorId: string,
  context: {
    churnRiskTier: string
    revenueTrend: string
    healthScore: number
    hasRecentSale: boolean
    isStuck: boolean
    abandonRate: number
  },
): Promise<CreatorCoordinationPlan> {
  const actions: string[] = []
  let urgency: CreatorCoordinationPlan["urgency"] = "routine"
  let primarySignal = "routine_monitoring"
  let monetizationOpportunity = false
  let retentionRisk = false
  let growthMomentum = false

  // Critical risk signals → immediate action
  if (context.churnRiskTier === "critical") {
    urgency = "immediate"
    primarySignal = "churn_critical"
    actions.push("trigger_churn_intervention_workflow")
    actions.push("send_retention_offer")
    retentionRisk = true
  } else if (context.churnRiskTier === "high") {
    urgency = "today"
    primarySignal = "churn_high_risk"
    actions.push("surface_recovery_recommendation")
    retentionRisk = true
  }

  // Revenue signals
  if (context.revenueTrend === "accelerating" || context.revenueTrend === "growing") {
    growthMomentum = true
    if (urgency === "routine") {
      urgency = "this_week"
      primarySignal = "growth_momentum"
    }
    actions.push("accelerate_growth_recommendations")
    actions.push("suggest_catalog_expansion")
    monetizationOpportunity = true
  } else if (context.revenueTrend === "declining") {
    if (urgency === "routine") urgency = "today"
    primarySignal = "revenue_declining"
    actions.push("trigger_revenue_recovery")
    retentionRisk = true
  }

  // Checkout abandonment
  if (context.abandonRate >= 0.4) {
    monetizationOpportunity = true
    actions.push("trigger_checkout_recovery_recommendations")
    if (urgency === "routine") urgency = "this_week"
  }

  // Lifecycle stuck
  if (context.isStuck) {
    actions.push("send_lifecycle_nudge")
    if (urgency === "routine") urgency = "today"
    if (primarySignal === "routine_monitoring") primarySignal = "lifecycle_stuck"
  }

  // Health score
  if (context.healthScore < 40) {
    actions.push("surface_health_improvement_recommendations")
  }

  return { creatorId, urgency, primarySignal, actions, monetizationOpportunity, retentionRisk, growthMomentum }
}
