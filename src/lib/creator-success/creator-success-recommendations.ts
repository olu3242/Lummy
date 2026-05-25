/**
 * Creator Success Recommendations — generates AI-assisted actionable recommendations
 * by combining risk signals, health scores, and growth profiles.
 *
 * Uses AI gateway for personalized recommendation copy when beneficial.
 * All recommendations persist to creator_recommendations + emit recommendation_generated.
 */

import { createAdminClient } from "@/lib/supabase/server"
import { generateText } from "@/lib/ai/gateway"
import { logger } from "@/lib/observability/logger"
import { runRecommendationEngine, getCreatorRecommendations } from "@/lib/intelligence/recommendation-engine"
import type { Recommendation } from "@/lib/intelligence/recommendation-engine"

export interface CreatorSuccessPlan {
  creatorId: string
  recommendations: Recommendation[]
  aiInsight: string | null
  priorityAction: string | null
  healthTrend: string
}

// ── AI-Assisted Recommendation Copy ──────────────────────────────────────────

async function generateAIInsight(
  creatorId: string,
  signals: {
    healthScore: number
    riskTier: string
    revenueTrend: string
    topSignals: string[]
  },
  tenantId: string,
): Promise<string | null> {
  if (signals.topSignals.length === 0) return null

  try {
    const prompt = `Creator ${creatorId} operational signals:
- Health score: ${signals.healthScore}/100
- Risk tier: ${signals.riskTier}
- Revenue trend: ${signals.revenueTrend}
- Key signals: ${signals.topSignals.join(", ")}

Write ONE concise, actionable tip (2-3 sentences max) to help this African creator improve their sales on Lummy. Be specific and practical. Use ₦ for amounts. No emojis.`

    const insight = await generateText("adaeze", "storefront_suggestion", prompt, {
      tenantId,
      creatorId,
    }, { maxTokens: 100, logToDb: false })

    return insight.trim() || null
  } catch {
    return null
  }
}

// ── Full Creator Success Plan ─────────────────────────────────────────────────

export async function buildCreatorSuccessPlan(
  creatorId: string,
  context: {
    healthScore: number
    riskTier: string
    revenueTrend: string
    riskSignals: string[]
    tenantId: string
  },
): Promise<CreatorSuccessPlan> {
  // Get existing pending recommendations
  const recommendations = await getCreatorRecommendations(creatorId)

  // Generate AI insight for high-risk creators (Haiku is cost-efficient here)
  let aiInsight: string | null = null
  if (context.riskTier === "high" || context.riskTier === "critical") {
    aiInsight = await generateAIInsight(creatorId, {
      healthScore:  context.healthScore,
      riskTier:     context.riskTier,
      revenueTrend: context.revenueTrend,
      topSignals:   context.riskSignals.slice(0, 3),
    }, context.tenantId).catch(() => null)
  }

  const priorityAction = recommendations.find(r => r.priority === "critical")?.title
    ?? recommendations.find(r => r.priority === "high")?.title
    ?? null

  const healthTrend =
    context.revenueTrend === "accelerating" ? "Strong growth trajectory" :
    context.revenueTrend === "growing"      ? "Positive revenue trend" :
    context.revenueTrend === "declining"    ? "Revenue declining — action needed" :
    "Stable — room to grow"

  return { creatorId, recommendations, aiInsight, priorityAction, healthTrend }
}

// ── Export recommendation engine runner ──────────────────────────────────────

export { runRecommendationEngine }
