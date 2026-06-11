import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"

export interface CreatorHealthScore {
  creatorId: string
  activationScore: number   // 0-100: profile, product, whatsapp, published, first sale
  engagementScore: number   // 0-100: recent activity, views, wa clicks
  storefrontScore: number   // 0-100: published, product count, schema completeness
  overallScore: number      // weighted average
  riskLevel: "healthy" | "at_risk" | "churned"
}

export async function computeCreatorScore(creatorId: string): Promise<CreatorHealthScore> {
  const supabase = createAdminClient()

  const [profileRes, productRes, metricsRes] = await Promise.allSettled([
    supabase.from("creator_profiles")
      .select("bio, avatar_url, whatsapp_number, is_published, first_sale_at, first_product_added_at")
      .eq("id", creatorId)
      .maybeSingle(),
    supabase.from("products")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .eq("is_published", true),
    supabase.from("creator_metrics_daily")
      .select("storefront_views, whatsapp_clicks, orders_created")
      .eq("creator_id", creatorId)
      .gte("date", new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0])
      .limit(30),
  ])

  const profile = profileRes.status === "fulfilled"
    ? (profileRes.value.data as {
        bio: string | null; avatar_url: string | null; whatsapp_number: string | null;
        is_published: boolean; first_sale_at: string | null; first_product_added_at: string | null
      } | null)
    : null

  const productCount = productRes.status === "fulfilled" ? (productRes.value.count ?? 0) : 0

  const metrics = metricsRes.status === "fulfilled"
    ? (metricsRes.value.data as { storefront_views: number; whatsapp_clicks: number; orders_created: number }[] ?? [])
    : []

  // Activation score (5 steps × 20pts)
  let activationScore = 0
  if (profile?.bio && profile?.avatar_url) activationScore += 20
  if (productCount > 0) activationScore += 20
  if (profile?.whatsapp_number) activationScore += 20
  if (profile?.is_published) activationScore += 20
  if (profile?.first_sale_at) activationScore += 20

  // Storefront score
  let storefrontScore = 0
  if (profile?.is_published) storefrontScore += 40
  if (productCount >= 1) storefrontScore += 20
  if (productCount >= 5) storefrontScore += 20
  if (productCount >= 10) storefrontScore += 20

  // Engagement score (30d activity)
  const totalViews  = metrics.reduce((s, r) => s + (r.storefront_views ?? 0), 0)
  const totalWA     = metrics.reduce((s, r) => s + (r.whatsapp_clicks ?? 0), 0)
  const totalOrders = metrics.reduce((s, r) => s + (r.orders_created ?? 0), 0)
  let engagementScore = 0
  if (totalViews > 0)   engagementScore += 30
  if (totalViews > 50)  engagementScore += 20
  if (totalWA > 0)      engagementScore += 25
  if (totalOrders > 0)  engagementScore += 25

  const overallScore = Math.round(activationScore * 0.4 + storefrontScore * 0.3 + engagementScore * 0.3)

  const riskLevel: CreatorHealthScore["riskLevel"] =
    overallScore >= 60 ? "healthy" :
    overallScore >= 30 ? "at_risk" : "churned"

  return { creatorId, activationScore, engagementScore, storefrontScore, overallScore, riskLevel }
}

export async function upsertHealthScore(score: CreatorHealthScore): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from("creator_health_scores").upsert({
      creator_id: score.creatorId,
      activation_score: score.activationScore,
      engagement_score: score.engagementScore,
      storefront_score: score.storefrontScore,
      overall_score: score.overallScore,
      risk_level: score.riskLevel,
      last_computed_at: new Date().toISOString(),
    }, { onConflict: "creator_id" })
  } catch (err) {
    logger.warn("[scoring] upsertHealthScore failed", { error: String(err) })
  }
}

export async function recordMilestone(creatorId: string, milestone: string): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from("creator_milestones").upsert(
      { creator_id: creatorId, milestone, achieved_at: new Date().toISOString() },
      { onConflict: "creator_id,milestone", ignoreDuplicates: true }
    )
  } catch { /* best-effort */ }
}
