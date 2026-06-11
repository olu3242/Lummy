/**
 * Creator Intelligence — revenue trends, engagement trends, storefront scoring.
 *
 * Reads from: creator_performance_snapshots, creator_health_scores,
 *             creator_metrics_daily, creator_churn_scores
 * Emits: creator_health_degraded, creator_revenue_drop, creator_growth_detected,
 *        creator_engagement_drop, creator_revenue_forecast_updated
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { emitEvent } from "@/lib/automation/sdk"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { IntelligenceRunResult } from "./intelligence-events"

const REVENUE_DROP_THRESHOLD_PCT = 20      // alert if revenue drops >20% week-over-week
const REVENUE_GROWTH_THRESHOLD_PCT = 30    // celebrate if revenue grows >30%
const HEALTH_DEGRADATION_THRESHOLD = 15   // alert if health score drops >15 points
const ENGAGEMENT_DROP_THRESHOLD_PCT = 25   // alert if engagement drops >25%

// ── Revenue Trend Analysis ────────────────────────────────────────────────────

export async function analyzeCreatorRevenueTrends(
  limit = 200,
): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("ci")
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    // Get current and previous 30-day windows per creator
    const today = new Date().toISOString().split("T")[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]
    const sixtyDaysAgo  = new Date(Date.now() - 60 * 86_400_000).toISOString().split("T")[0]

    const { data: snapshots } = await supabase
      .from("creator_performance_snapshots")
      .select("creator_id, snapshot_date, revenue_kobo, order_count")
      .gte("snapshot_date", sixtyDaysAgo)
      .lte("snapshot_date", today)
      .order("snapshot_date", { ascending: false })
      .limit(limit * 2)

    if (!snapshots?.length) {
      return { module: "creator-intelligence", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
    }

    // Group by creator: separate current vs previous 30-day windows
    const byCreator = new Map<string, { current: number; previous: number }>()
    const midpoint = thirtyDaysAgo

    for (const snap of snapshots as { creator_id: string; snapshot_date: string; revenue_kobo: number; order_count: number }[]) {
      const c = byCreator.get(snap.creator_id) ?? { current: 0, previous: 0 }
      if (snap.snapshot_date >= midpoint) c.current += snap.revenue_kobo
      else c.previous += snap.revenue_kobo
      byCreator.set(snap.creator_id, c)
    }

    for (const [creatorId, { current, previous }] of byCreator.entries()) {
      if (previous === 0) continue  // can't compute trend without baseline

      const changePct = ((current - previous) / previous) * 100

      if (changePct <= -REVENUE_DROP_THRESHOLD_PCT) {
        await emitEvent("creator_revenue_drop", { tenantId: creatorId, creatorId, correlationId }, {
          currentRevenueKobo: current,
          previousRevenueKobo: previous,
          dropPct: Math.abs(changePct),
          windowDays: 30,
        }, `creator_revenue_drop:${creatorId}:${today}`)
        signals.push(`revenue_drop:${creatorId}:${changePct.toFixed(1)}%`)
        eventsEmitted++
      } else if (changePct >= REVENUE_GROWTH_THRESHOLD_PCT) {
        await emitEvent("creator_growth_detected", { tenantId: creatorId, creatorId, correlationId }, {
          growthPct: changePct,
          currentRevenueKobo: current,
          windowDays: 30,
          trigger: "revenue",
        }, `creator_growth_detected:${creatorId}:${today}`)
        signals.push(`revenue_growth:${creatorId}:${changePct.toFixed(1)}%`)
        eventsEmitted++
      }
    }
  } catch (err) {
    logger.error("[creator-intelligence] revenue trend analysis failed", { error: String(err), correlationId })
  }

  return { module: "creator-intelligence-revenue", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}

// ── Health Score Degradation Detection ───────────────────────────────────────

export async function detectHealthScoreDegradation(
  limit = 200,
): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("ci")
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    // Get current health scores
    const { data: scores } = await supabase
      .from("creator_health_scores")
      .select("creator_id, overall_score, risk_level, last_computed_at")
      .order("last_computed_at", { ascending: false })
      .limit(limit)

    if (!scores?.length) {
      return { module: "creator-intelligence-health", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
    }

    // Compare with 7-day-ago snapshots
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]
    const { data: oldSnapshots } = await supabase
      .from("creator_performance_snapshots")
      .select("creator_id, health_score")
      .lte("snapshot_date", sevenDaysAgo)
      .order("snapshot_date", { ascending: false })
      .limit(limit)

    const oldScoreMap = new Map<string, number>()
    for (const snap of (oldSnapshots ?? []) as { creator_id: string; health_score: number | null }[]) {
      if (!oldScoreMap.has(snap.creator_id) && snap.health_score !== null) {
        oldScoreMap.set(snap.creator_id, snap.health_score)
      }
    }

    for (const score of scores as { creator_id: string; overall_score: number; risk_level: string }[]) {
      const prev = oldScoreMap.get(score.creator_id)
      if (prev === undefined) continue

      const drop = prev - score.overall_score
      if (drop >= HEALTH_DEGRADATION_THRESHOLD) {
        await emitEvent("creator_health_degraded", { tenantId: score.creator_id, creatorId: score.creator_id, correlationId }, {
          previousScore: prev,
          currentScore: score.overall_score,
          dropPct: (drop / prev) * 100,
          riskLevel: score.risk_level,
          signals: [`score_dropped_${drop.toFixed(0)}_points`],
        }, `creator_health_degraded:${score.creator_id}:${new Date().toISOString().split("T")[0]}`)
        signals.push(`health_drop:${score.creator_id}:${drop.toFixed(0)}pts`)
        eventsEmitted++
      }
    }
  } catch (err) {
    logger.error("[creator-intelligence] health degradation detection failed", { error: String(err) })
  }

  return { module: "creator-intelligence-health", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}

// ── Engagement Drop Detection ─────────────────────────────────────────────────

export async function detectEngagementDrops(
  limit = 200,
): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("ci")
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    const sevenDaysAgo  = new Date(Date.now() - 7  * 86_400_000).toISOString().split("T")[0]
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString().split("T")[0]
    const today = new Date().toISOString().split("T")[0]

    // Current week vs previous week engagement per creator
    const { data: metrics } = await supabase
      .from("creator_metrics_daily")
      .select("creator_id, date, storefront_views, whatsapp_clicks")
      .gte("date", fourteenDaysAgo)
      .lte("date", today)
      .order("date", { ascending: false })
      .limit(limit * 14)

    if (!metrics?.length) {
      return { module: "creator-intelligence-engagement", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
    }

    const byCreator = new Map<string, { curr: number; prev: number }>()
    for (const m of metrics as { creator_id: string; date: string; storefront_views: number; whatsapp_clicks: number }[]) {
      const engagement = m.storefront_views + m.whatsapp_clicks * 3
      const c = byCreator.get(m.creator_id) ?? { curr: 0, prev: 0 }
      if (m.date >= sevenDaysAgo) c.curr += engagement
      else c.prev += engagement
      byCreator.set(m.creator_id, c)
    }

    for (const [creatorId, { curr, prev }] of byCreator.entries()) {
      if (prev === 0) continue
      const dropPct = ((prev - curr) / prev) * 100
      if (dropPct >= ENGAGEMENT_DROP_THRESHOLD_PCT) {
        await emitEvent("creator_engagement_drop", { tenantId: creatorId, creatorId, correlationId }, {
          currentEngagement: curr,
          previousEngagement: prev,
          dropPct,
          windowDays: 7,
        }, `creator_engagement_drop:${creatorId}:${today}`)
        signals.push(`engagement_drop:${creatorId}:${dropPct.toFixed(1)}%`)
        eventsEmitted++
      }
    }
  } catch (err) {
    logger.error("[creator-intelligence] engagement drop detection failed", { error: String(err) })
  }

  return { module: "creator-intelligence-engagement", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}

// ── Revenue Forecast ──────────────────────────────────────────────────────────

export async function computeRevenueForecast(creatorId: string): Promise<{
  forecastKobo: number
  confidence: "low" | "medium" | "high"
  trend: "up" | "down" | "stable"
}> {
  const supabase = createAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]

  const { data: metrics } = await supabase
    .from("creator_metrics_daily")
    .select("revenue_ngn, date")
    .eq("creator_id", creatorId)
    .gte("date", thirtyDaysAgo)
    .order("date", { ascending: true })
    .limit(30)

  const rows = (metrics ?? []) as { revenue_ngn: number; date: string }[]
  if (rows.length < 7) return { forecastKobo: 0, confidence: "low", trend: "stable" }

  // Simple linear regression on daily revenue
  const n = rows.length
  const xMean = (n - 1) / 2
  const yMean = rows.reduce((s, r) => s + r.revenue_ngn, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (rows[i].revenue_ngn - yMean)
    den += (i - xMean) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  const intercept = yMean - slope * xMean

  const forecast30 = Math.max(0, (intercept + slope * (n + 29)) * 30)
  const trend: "up" | "down" | "stable" = slope > yMean * 0.01 ? "up" : slope < -yMean * 0.01 ? "down" : "stable"
  const confidence: "low" | "medium" | "high" = n >= 25 ? "high" : n >= 14 ? "medium" : "low"

  return { forecastKobo: Math.round(forecast30 * 100), confidence, trend }
}
