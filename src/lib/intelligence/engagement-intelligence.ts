/**
 * Engagement Intelligence — customer engagement scoring, WhatsApp engagement,
 * re-engagement detection, conversation completion scoring.
 *
 * Reads from: creator_metrics_daily, automation_logs
 * Emits: customer_reengagement_needed
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { emitEvent } from "@/lib/automation/sdk"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { IntelligenceRunResult } from "./intelligence-events"

const REENGAGEMENT_DAYS = 21     // 21 days silent = needs re-engagement signal

// ── Creator Engagement Score ──────────────────────────────────────────────────

export interface CreatorEngagementScore {
  creatorId: string
  score: number              // 0-100
  whatsappEngagement: number // wa clicks / storefront views %
  viewTrend: "rising" | "falling" | "stable"
  responseQuality: "active" | "slow" | "inactive"
  lastActiveDate: string
}

export async function computeCreatorEngagementScore(
  creatorId: string,
): Promise<CreatorEngagementScore> {
  const supabase = createAdminClient()
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString().split("T")[0]

  const { data: metrics } = await supabase
    .from("creator_metrics_daily")
    .select("date, storefront_views, whatsapp_clicks, orders_created, ai_generations_count")
    .eq("creator_id", creatorId)
    .gte("date", fourteenDaysAgo)
    .order("date", { ascending: true })

  const rows = (metrics ?? []) as { date: string; storefront_views: number; whatsapp_clicks: number; orders_created: number; ai_generations_count: number }[]
  if (!rows.length) {
    return { creatorId, score: 0, whatsappEngagement: 0, viewTrend: "falling", responseQuality: "inactive", lastActiveDate: "" }
  }

  const totalViews = rows.reduce((s, r) => s + r.storefront_views, 0)
  const totalWA    = rows.reduce((s, r) => s + r.whatsapp_clicks, 0)
  const totalOrders = rows.reduce((s, r) => s + r.orders_created, 0)

  const waEngagement = totalViews > 0 ? (totalWA / totalViews) * 100 : 0

  // View trend: compare first 7 vs second 7 days
  const half = Math.floor(rows.length / 2)
  const firstHalfViews = rows.slice(0, half).reduce((s, r) => s + r.storefront_views, 0)
  const secondHalfViews = rows.slice(half).reduce((s, r) => s + r.storefront_views, 0)
  const viewTrend: "rising" | "falling" | "stable" =
    secondHalfViews > firstHalfViews * 1.1 ? "rising" :
    secondHalfViews < firstHalfViews * 0.9 ? "falling" :
    "stable"

  const lastActiveDate = rows[rows.length - 1]?.date ?? ""
  const daysSinceActive = lastActiveDate
    ? Math.floor((Date.now() - new Date(lastActiveDate).getTime()) / 86_400_000)
    : 999

  const responseQuality: "active" | "slow" | "inactive" =
    daysSinceActive <= 3 ? "active" :
    daysSinceActive <= 7 ? "slow" :
    "inactive"

  // Composite score
  const score = Math.min(100, Math.round(
    (Math.min(waEngagement, 30) / 30) * 30 +
    (viewTrend === "rising" ? 20 : viewTrend === "stable" ? 10 : 0) +
    (responseQuality === "active" ? 30 : responseQuality === "slow" ? 15 : 0) +
    Math.min(totalOrders * 5, 20)
  ))

  return { creatorId, score, whatsappEngagement: waEngagement, viewTrend, responseQuality, lastActiveDate }
}

// ── Customer Re-engagement Detection ─────────────────────────────────────────

export async function detectDisengagedCustomers(): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("eng")
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    const cutoffDate = new Date(Date.now() - REENGAGEMENT_DAYS * 86_400_000).toISOString()
    const today = new Date().toISOString().split("T")[0]

    // Find customers who had orders before cutoff but none after
    const { data: oldCustomers } = await supabase
      .from("orders")
      .select("creator_id, customer_email, customer_phone")
      .eq("status", "completed")
      .lt("created_at", cutoffDate)
      .limit(500)

    if (!oldCustomers?.length) {
      return { module: "engagement-intelligence", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
    }

    // Check which haven't ordered recently
    const { data: recentCustomers } = await supabase
      .from("orders")
      .select("customer_email, customer_phone")
      .eq("status", "completed")
      .gte("created_at", cutoffDate)
      .limit(2000)

    const recentSet = new Set<string>()
    for (const r of (recentCustomers ?? []) as { customer_email?: string; customer_phone?: string }[]) {
      if (r.customer_email) recentSet.add(r.customer_email)
      if (r.customer_phone) recentSet.add(r.customer_phone)
    }

    const emittedPerCreator = new Set<string>()

    for (const c of oldCustomers as { creator_id: string; customer_email?: string; customer_phone?: string }[]) {
      const isRecent = (c.customer_email && recentSet.has(c.customer_email)) ||
                       (c.customer_phone && recentSet.has(c.customer_phone))
      if (isRecent) continue

      const key = `${c.creator_id}:${c.customer_email ?? c.customer_phone}`
      if (emittedPerCreator.has(key)) continue
      emittedPerCreator.add(key)

      if (emittedPerCreator.size > 50) break  // rate limit: max 50 per run

      await emitEvent("customer_reengagement_needed", { tenantId: c.creator_id, creatorId: c.creator_id, correlationId }, {
        customerEmail: c.customer_email,
        customerPhone: c.customer_phone,
        silentDays: REENGAGEMENT_DAYS,
      }, `customer_reengagement:${c.creator_id}:${c.customer_email ?? c.customer_phone}:${today}`)

      signals.push(`reengagement:${c.creator_id}`)
      eventsEmitted++
    }
  } catch (err) {
    logger.error("[engagement-intelligence] disengaged customer detection failed", { error: String(err) })
  }

  return { module: "engagement-intelligence", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}

// ── WhatsApp Engagement Score (per creator) ───────────────────────────────────

export async function getWhatsAppEngagementSummary(creatorId: string): Promise<{
  clickRate: number
  conversionRate: number
  weeklyClicks: number
  trend: "up" | "down" | "stable"
}> {
  const supabase = createAdminClient()
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString().split("T")[0]

  const { data } = await supabase
    .from("creator_metrics_daily")
    .select("date, storefront_views, whatsapp_clicks, orders_created")
    .eq("creator_id", creatorId)
    .gte("date", fourteenDaysAgo)
    .order("date", { ascending: true })

  const rows = (data ?? []) as { date: string; storefront_views: number; whatsapp_clicks: number; orders_created: number }[]
  if (!rows.length) return { clickRate: 0, conversionRate: 0, weeklyClicks: 0, trend: "stable" }

  const half = Math.floor(rows.length / 2)
  const week1 = rows.slice(0, half)
  const week2 = rows.slice(half)

  const w1clicks = week1.reduce((s, r) => s + r.whatsapp_clicks, 0)
  const w2clicks = week2.reduce((s, r) => s + r.whatsapp_clicks, 0)
  const trend: "up" | "down" | "stable" =
    w2clicks > w1clicks * 1.1 ? "up" :
    w2clicks < w1clicks * 0.9 ? "down" :
    "stable"

  const totalViews   = rows.reduce((s, r) => s + r.storefront_views, 0)
  const totalClicks  = rows.reduce((s, r) => s + r.whatsapp_clicks, 0)
  const totalOrders  = rows.reduce((s, r) => s + r.orders_created, 0)

  return {
    clickRate:      totalViews  > 0 ? (totalClicks / totalViews)  * 100 : 0,
    conversionRate: totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0,
    weeklyClicks: w2clicks,
    trend,
  }
}
