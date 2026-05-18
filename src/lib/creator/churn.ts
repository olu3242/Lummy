import { createAdminClient } from "@/lib/supabase/server"
import { dispatchAutomation } from "@/lib/automation/triggers"
import { logger } from "@/lib/observability/logger"

export interface ChurnRiskScore {
  creatorId: string
  riskScore: number        // 0-100 (higher = more at risk)
  riskTier: "low" | "medium" | "high" | "critical"
  signals: string[]
  recommendedAction: string
}

export async function computeChurnRisk(creatorId: string): Promise<ChurnRiskScore> {
  const supabase = createAdminClient()
  const now = Date.now()
  const day = 86_400_000

  const [profileRes, ordersRes, engagementRes] = await Promise.allSettled([
    supabase.from("creator_profiles")
      .select("is_published, whatsapp_number, first_product_added_at, first_sale_at, created_at, onboarding_completed")
      .eq("id", creatorId)
      .maybeSingle(),
    supabase.from("orders")
      .select("created_at")
      .eq("creator_id", creatorId)
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.from("creator_engagement_events")
      .select("occurred_at")
      .eq("creator_id", creatorId)
      .order("occurred_at", { ascending: false })
      .limit(1),
  ])

  const profile = profileRes.status === "fulfilled"
    ? (profileRes.value.data as {
        is_published: boolean; whatsapp_number: string | null;
        first_product_added_at: string | null; first_sale_at: string | null;
        created_at: string; onboarding_completed: boolean
      } | null)
    : null

  const lastOrder = ordersRes.status === "fulfilled"
    ? (ordersRes.value.data as { created_at: string }[] | null)?.[0]
    : null

  const lastActivity = engagementRes.status === "fulfilled"
    ? (engagementRes.value.data as { occurred_at: string }[] | null)?.[0]
    : null

  const signals: string[] = []
  let riskScore = 0

  const daysSinceCreated = profile?.created_at
    ? Math.floor((now - new Date(profile.created_at).getTime()) / day)
    : 0

  // Onboarding incomplete after 3+ days
  if (!profile?.onboarding_completed && daysSinceCreated > 3) {
    signals.push("onboarding_incomplete")
    riskScore += 20
  }

  // No product after 7 days
  if (!profile?.first_product_added_at && daysSinceCreated > 7) {
    signals.push("no_product_7d")
    riskScore += 25
  }

  // Not published after 14 days
  if (!profile?.is_published && daysSinceCreated > 14) {
    signals.push("not_published_14d")
    riskScore += 20
  }

  // No WhatsApp
  if (!profile?.whatsapp_number) {
    signals.push("no_whatsapp")
    riskScore += 10
  }

  // No recent activity
  const lastActivityAt = lastActivity?.occurred_at
    ? new Date(lastActivity.occurred_at).getTime()
    : (profile?.created_at ? new Date(profile.created_at).getTime() : now)
  const daysSinceActivity = Math.floor((now - lastActivityAt) / day)

  if (daysSinceActivity > 30) { signals.push("inactive_30d"); riskScore += 25 }
  else if (daysSinceActivity > 14) { signals.push("inactive_14d"); riskScore += 15 }
  else if (daysSinceActivity > 7) { signals.push("inactive_7d"); riskScore += 8 }

  // No recent sales
  const lastOrderAt = lastOrder?.created_at ? new Date(lastOrder.created_at).getTime() : null
  if (profile?.first_sale_at && lastOrderAt) {
    const daysSinceOrder = Math.floor((now - lastOrderAt) / day)
    if (daysSinceOrder > 30) { signals.push("no_sales_30d"); riskScore += 15 }
  }

  riskScore = Math.min(100, riskScore)

  const riskTier: ChurnRiskScore["riskTier"] =
    riskScore >= 70 ? "critical" :
    riskScore >= 50 ? "high" :
    riskScore >= 25 ? "medium" : "low"

  const recommendedAction =
    riskTier === "critical" ? "Immediate outreach — creator likely to churn" :
    riskTier === "high"     ? "Send personalized re-engagement nudge" :
    riskTier === "medium"   ? "Send educational content or tip" :
    "Monitor — no action needed"

  return { creatorId, riskScore, riskTier, signals, recommendedAction }
}

export async function upsertChurnScore(score: ChurnRiskScore): Promise<void> {
  const supabase = createAdminClient()
  void Promise.resolve(
    supabase.from("creator_churn_scores").upsert({
      creator_id: score.creatorId,
      risk_score: score.riskScore,
      risk_tier: score.riskTier,
      signals: score.signals,
      last_computed_at: new Date().toISOString(),
    }, { onConflict: "creator_id" })
  ).catch(() => {})
}

export async function getChurnRiskDistribution(): Promise<{
  critical: number; high: number; medium: number; low: number; total: number
}> {
  const supabase = createAdminClient()
  const { data } = await supabase.from("creator_churn_scores").select("risk_tier")
  const rows = (data as { risk_tier: string }[] | null) ?? []
  return {
    critical: rows.filter(r => r.risk_tier === "critical").length,
    high:     rows.filter(r => r.risk_tier === "high").length,
    medium:   rows.filter(r => r.risk_tier === "medium").length,
    low:      rows.filter(r => r.risk_tier === "low").length,
    total:    rows.length,
  }
}

export async function runChurnScoringJob(limit = 200): Promise<{ scored: number; critical: number }> {
  const supabase = createAdminClient()
  const { data: creators } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("is_active", true)
    .limit(limit)

  if (!creators?.length) return { scored: 0, critical: 0 }

  let critical = 0
  for (const { id } of creators as { id: string }[]) {
    try {
      const score = await computeChurnRisk(id)
      await upsertChurnScore(score)
      if (score.riskTier === "critical") {
        critical++
        dispatchAutomation({
          name: "creator_inactive_30d",
          creatorId: id,
          payload: { riskScore: score.riskScore, signals: score.signals },
          idempotencyKey: `churn_critical:${id}:${new Date().toISOString().slice(0, 10)}`,
        })
      } else if (score.riskTier === "high") {
        dispatchAutomation({
          name: "creator_inactive_7d",
          creatorId: id,
          payload: { riskScore: score.riskScore, signals: score.signals },
          idempotencyKey: `churn_high:${id}:${new Date().toISOString().slice(0, 10)}`,
        })
      }
    } catch (err) {
      logger.warn("[churn] scoring failed", { creatorId: id, error: String(err) })
    }
  }

  return { scored: creators.length, critical }
}
