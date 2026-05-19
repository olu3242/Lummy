import { createAdminClient } from "@/lib/supabase/server"

export interface FirstSaleGap {
  type: "no_products" | "unpublished" | "no_whatsapp" | "low_views" | "weak_cta" | "ready"
  label: string
  suggestion: string
  priority: "high" | "medium" | "low"
}

export interface FirstSaleReadiness {
  hasFirstSale: boolean
  daysSinceSignup: number
  gaps: FirstSaleGap[]
  readinessScore: number
  nudge: string | null
}

export interface PlatformFirstSaleStats {
  medianDaysToFirstSale: number | null
  avgDaysToFirstSale: number | null
  creatorsWithFirstSale: number
  creatorsPublishedNoSale: number
  creatorsNoProduct: number
}

export async function getFirstSaleReadiness(creatorId: string): Promise<FirstSaleReadiness> {
  const supabase = createAdminClient()

  const [profileRes, productsRes, metricsRes] = await Promise.allSettled([
    supabase.from("creator_profiles")
      .select("is_published, whatsapp_number, first_sale_at, created_at, bio, avatar_url")
      .eq("id", creatorId)
      .maybeSingle(),
    supabase.from("products")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .eq("is_published", true),
    supabase.from("creator_metrics_daily")
      .select("storefront_views, whatsapp_clicks")
      .eq("creator_id", creatorId)
      .gte("date", new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]),
  ])

  const profile = profileRes.status === "fulfilled"
    ? (profileRes.value.data as {
        is_published: boolean; whatsapp_number: string | null
        first_sale_at: string | null; created_at: string; bio: string | null; avatar_url: string | null
      } | null)
    : null

  const productCount = productsRes.status === "fulfilled" ? (productsRes.value.count ?? 0) : 0

  const metrics = metricsRes.status === "fulfilled"
    ? (metricsRes.value.data as { storefront_views: number; whatsapp_clicks: number }[] | null) ?? []
    : []

  const weeklyViews = metrics.reduce((s, m) => s + (m.storefront_views ?? 0), 0)
  const weeklyClicks = metrics.reduce((s, m) => s + (m.whatsapp_clicks ?? 0), 0)

  const hasFirstSale = !!profile?.first_sale_at
  const daysSinceSignup = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86_400_000)
    : 0

  if (hasFirstSale) {
    return {
      hasFirstSale: true,
      daysSinceSignup,
      gaps: [{ type: "ready", label: "First sale achieved!", suggestion: "Keep going — focus on repeat buyers.", priority: "low" }],
      readinessScore: 100,
      nudge: null,
    }
  }

  const gaps: FirstSaleGap[] = []

  if (productCount === 0) {
    gaps.push({ type: "no_products", label: "No products listed", suggestion: "Add at least one product to your catalogue", priority: "high" })
  }

  if (!profile?.is_published) {
    gaps.push({ type: "unpublished", label: "Store not published", suggestion: "Publish your store so buyers can find you", priority: "high" })
  }

  if (!profile?.whatsapp_number) {
    gaps.push({ type: "no_whatsapp", label: "WhatsApp not connected", suggestion: "Add your WhatsApp number so buyers can contact you instantly", priority: "high" })
  }

  if (weeklyViews < 50 && productCount > 0 && profile?.is_published) {
    gaps.push({ type: "low_views", label: "Low storefront traffic", suggestion: "Share your storefront link on Instagram Stories, TikTok bio, or WhatsApp status", priority: "medium" })
  }

  if (weeklyViews > 30 && weeklyClicks < 3) {
    gaps.push({ type: "weak_cta", label: "Low WhatsApp clicks", suggestion: "Use a stronger CTA — try 'Order now via WhatsApp' instead of generic links", priority: "medium" })
  }

  if (gaps.length === 0) {
    gaps.push({ type: "ready", label: "Store looks good!", suggestion: "Share your link consistently — most first sales come from direct outreach", priority: "low" })
  }

  const readinessScore = Math.max(0, 100 - gaps.filter(g => g.priority === "high").length * 30 - gaps.filter(g => g.priority === "medium").length * 10)

  let nudge: string | null = null
  if (daysSinceSignup >= 7 && !hasFirstSale) {
    nudge = daysSinceSignup >= 30
      ? "You've been on Lummy for over a month — your first sale is one share away. Try sending your storefront link directly to 3 people today."
      : "7 days in and no sale yet? Share your store link on WhatsApp status today — it only takes 30 seconds."
  }

  return { hasFirstSale, daysSinceSignup, gaps, readinessScore, nudge }
}

export async function getPlatformFirstSaleStats(): Promise<PlatformFirstSaleStats> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("creator_profiles")
    .select("created_at, first_sale_at, is_published, first_product_added_at")

  const creators = (data as {
    created_at: string; first_sale_at: string | null; is_published: boolean; first_product_added_at: string | null
  }[] | null) ?? []

  const withSale = creators.filter(c => c.first_sale_at)
  const creatorsWithFirstSale = withSale.length
  const creatorsPublishedNoSale = creators.filter(c => c.is_published && !c.first_sale_at).length
  const creatorsNoProduct = creators.filter(c => !c.first_product_added_at).length

  const daysToSale = withSale
    .map(c => Math.max(0, Math.floor((new Date(c.first_sale_at!).getTime() - new Date(c.created_at).getTime()) / 86_400_000)))
    .sort((a, b) => a - b)

  const medianDaysToFirstSale = daysToSale.length > 0 ? daysToSale[Math.floor(daysToSale.length / 2)] : null
  const avgDaysToFirstSale = daysToSale.length > 0
    ? Math.round(daysToSale.reduce((s, d) => s + d, 0) / daysToSale.length * 10) / 10
    : null

  return { medianDaysToFirstSale, avgDaysToFirstSale, creatorsWithFirstSale, creatorsPublishedNoSale, creatorsNoProduct }
}
