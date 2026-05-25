/**
 * Recommendation Engine — lightweight operational recommendations.
 *
 * Reads from: creator_health_scores, creator_churn_scores,
 *             creator_performance_snapshots, creator_metrics_daily
 * Emits: recommendation_generated
 * Writes: creator_recommendations
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { emitEvent } from "@/lib/automation/sdk"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { IntelligenceRunResult } from "./intelligence-events"

export type RecommendationType =
  | "product_optimization" | "pricing" | "storefront" | "messaging"
  | "engagement_timing" | "checkout_recovery" | "onboarding"
  | "conversion" | "ai_usage" | "workflow"

export interface Recommendation {
  creatorId: string
  organizationId?: string
  type: RecommendationType
  title: string
  body: string
  priority: "low" | "medium" | "high" | "critical"
}

// ── Recommendation signal rules ───────────────────────────────────────────────

function buildRecommendations(signals: {
  creatorId: string
  organizationId?: string
  riskTier?: string
  riskSignals?: string[]
  healthScore?: number
  hasProduct?: boolean
  isPublished?: boolean
  hasWhatsApp?: boolean
  abandonRate?: number
  engagementScore?: number
  waClickRate?: number
}): Recommendation[] {
  const recs: Recommendation[] = []
  const { creatorId, organizationId } = signals

  // Onboarding gaps
  if (signals.riskSignals?.includes("no_product_7d")) {
    recs.push({
      creatorId, organizationId,
      type: "product_optimization",
      title: "Add your first product to start selling",
      body: "Stores with at least one product get 3× more WhatsApp inquiries. Add a product with a clear photo and price to activate your storefront.",
      priority: "critical",
    })
  }

  if (signals.riskSignals?.includes("not_published_14d")) {
    recs.push({
      creatorId, organizationId,
      type: "storefront",
      title: "Publish your store to go live",
      body: "Your store is set up but not yet visible to customers. Publishing takes 30 seconds — go live now to start receiving orders.",
      priority: "high",
    })
  }

  if (signals.riskSignals?.includes("no_whatsapp")) {
    recs.push({
      creatorId, organizationId,
      type: "messaging",
      title: "Connect your WhatsApp number",
      body: "58% of Lummy sales come via WhatsApp. Adding your number enables the 'Order on WhatsApp' button that drives your highest-converting traffic.",
      priority: "high",
    })
  }

  // Engagement-based recommendations
  if ((signals.waClickRate ?? 100) < 5 && signals.isPublished) {
    recs.push({
      creatorId, organizationId,
      type: "conversion",
      title: "Your WhatsApp CTA click rate is low",
      body: "Less than 5% of store visitors click 'Order on WhatsApp'. Try adding a discount offer or urgency message in your store banner.",
      priority: "medium",
    })
  }

  if ((signals.abandonRate ?? 0) > 0.4) {
    recs.push({
      creatorId, organizationId,
      type: "checkout_recovery",
      title: "High checkout abandonment detected",
      body: `${Math.round((signals.abandonRate ?? 0) * 100)}% of checkout attempts are not completing. Common fixes: simplify product descriptions, confirm pricing is clear, and ensure your WhatsApp is responsive.`,
      priority: "high",
    })
  }

  // Health score recovery
  if ((signals.healthScore ?? 100) < 40) {
    recs.push({
      creatorId, organizationId,
      type: "storefront",
      title: "Your store health score is low",
      body: "A health score below 40 usually means missing profile info, no published products, or low recent engagement. Complete your profile and add 3+ products to recover your score.",
      priority: "medium",
    })
  }

  // Timing optimization
  if ((signals.engagementScore ?? 100) < 30 && signals.isPublished) {
    recs.push({
      creatorId, organizationId,
      type: "engagement_timing",
      title: "Broadcast during peak hours for 3× more engagement",
      body: "Nigerian customers are most active 6-8pm on weekdays and 12pm-3pm on weekends. Schedule your WhatsApp broadcasts to hit during these windows.",
      priority: "low",
    })
  }

  return recs
}

// ── Persist and emit recommendations ─────────────────────────────────────────

async function persistAndEmitRecommendation(rec: Recommendation, correlationId: string): Promise<void> {
  const supabase = createAdminClient()

  // Check if same recommendation type was already generated today
  const today = new Date().toISOString().split("T")[0]
  const { data: existing } = await supabase
    .from("creator_recommendations")
    .select("id")
    .eq("creator_id", rec.creatorId)
    .eq("type", rec.type)
    .gte("created_at", today)
    .eq("status", "pending")
    .maybeSingle()

  if (existing) return  // already have a pending recommendation of this type today

  await supabase.from("creator_recommendations").insert({
    creator_id:      rec.creatorId,
    organization_id: rec.organizationId ?? null,
    type:            rec.type,
    title:           rec.title,
    body:            rec.body,
    priority:        rec.priority,
    correlation_id:  correlationId,
    expires_at:      new Date(Date.now() + 7 * 86_400_000).toISOString(),
  })

  await emitEvent("recommendation_generated", {
    tenantId:   rec.organizationId ?? rec.creatorId,
    creatorId:  rec.creatorId,
    correlationId,
  }, {
    recommendationType: rec.type,
    title:              rec.title,
    body:               rec.body,
    priority:           rec.priority,
  }, `recommendation:${rec.creatorId}:${rec.type}:${today}`)
}

// ── Run recommendation engine for a batch of creators ─────────────────────────

export async function runRecommendationEngine(limit = 100): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("rec")
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    // Get creators with churn signals and health scores
    const { data: churnScores } = await supabase
      .from("creator_churn_scores")
      .select("creator_id, risk_tier, signals, risk_score")
      .in("risk_tier", ["medium", "high", "critical"])
      .order("risk_score", { ascending: false })
      .limit(limit)

    const { data: healthScores } = await supabase
      .from("creator_health_scores")
      .select("creator_id, overall_score, risk_level")
      .order("overall_score", { ascending: true })
      .limit(limit)

    // Merge by creator_id
    const creatorMap = new Map<string, {
      creatorId: string
      riskTier?: string
      riskSignals: string[]
      healthScore?: number
    }>()

    for (const c of (churnScores ?? []) as { creator_id: string; risk_tier: string; signals: string[] }[]) {
      creatorMap.set(c.creator_id, { creatorId: c.creator_id, riskTier: c.risk_tier, riskSignals: c.signals ?? [], healthScore: undefined })
    }
    for (const h of (healthScores ?? []) as { creator_id: string; overall_score: number; risk_level: string }[]) {
      const existing = creatorMap.get(h.creator_id) ?? { creatorId: h.creator_id, riskSignals: [] }
      existing.healthScore = h.overall_score
      creatorMap.set(h.creator_id, existing)
    }

    for (const creator of creatorMap.values()) {
      const recs = buildRecommendations({
        creatorId:       creator.creatorId,
        riskTier:        creator.riskTier,
        riskSignals:     creator.riskSignals,
        healthScore:     creator.healthScore,
      })

      for (const rec of recs) {
        try {
          await persistAndEmitRecommendation(rec, correlationId)
          signals.push(`rec:${rec.creatorId}:${rec.type}`)
          eventsEmitted++
        } catch {
          // best-effort
        }
      }
    }
  } catch (err) {
    logger.error("[recommendation-engine] run failed", { error: String(err) })
  }

  return { module: "recommendation-engine", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}

// ── Fetch recommendations for creator ────────────────────────────────────────

export async function getCreatorRecommendations(creatorId: string): Promise<Recommendation[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("creator_recommendations")
    .select("type, title, body, priority, creator_id")
    .eq("creator_id", creatorId)
    .eq("status", "pending")
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .order("priority", { ascending: false })
    .limit(5)

  return ((data ?? []) as { type: string; title: string; body: string; priority: string; creator_id: string }[])
    .map(r => ({
      creatorId:  r.creator_id,
      type:       r.type as Recommendation["type"],
      title:      r.title,
      body:       r.body,
      priority:   r.priority as Recommendation["priority"],
    }))
}
