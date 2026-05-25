/**
 * Creator Optimization Engine — product optimization scoring, storefront
 * profitability scoring, pricing recommendations, conversion efficiency.
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"

export interface ProductOptimizationScore {
  productId: string
  name: string
  score: number          // 0-100
  issues: string[]
  opportunities: string[]
  conversionRate: number
  viewToWAClickRate: number
}

export interface StorefrontOptimizationScore {
  creatorId: string
  overallScore: number   // 0-100
  productCount: number
  publishedCount: number
  hasWhatsApp: boolean
  hasBio: boolean
  hasAvatar: boolean
  completenessScore: number
  conversionPotential: "low" | "medium" | "high"
  topIssue: string | null
}

// ── Storefront Completeness Scoring ──────────────────────────────────────────

export async function scoreStorefrontOptimization(
  creatorId: string,
): Promise<StorefrontOptimizationScore> {
  const supabase = createAdminClient()

  const [profileRes, productRes] = await Promise.allSettled([
    supabase.from("creator_profiles")
      .select("bio, avatar_url, whatsapp_number, is_published, store_name")
      .eq("id", creatorId)
      .maybeSingle(),
    supabase.from("products")
      .select("id, is_published, price, image_url, description")
      .eq("creator_id", creatorId)
      .limit(50),
  ])

  const profile = profileRes.status === "fulfilled"
    ? (profileRes.value.data as { bio?: string; avatar_url?: string; whatsapp_number?: string; is_published?: boolean; store_name?: string } | null)
    : null

  const products = productRes.status === "fulfilled"
    ? (productRes.value.data ?? []) as { id: string; is_published: boolean; price: number; image_url?: string; description?: string }[]
    : []

  const published = products.filter(p => p.is_published)
  const withImages = products.filter(p => p.image_url)
  const withDescriptions = products.filter(p => p.description)

  const hasWhatsApp = !!profile?.whatsapp_number
  const hasBio = !!(profile?.bio && profile.bio.length > 10)
  const hasAvatar = !!profile?.avatar_url

  // Completeness: 5 criteria × 20pts
  let completenessScore = 0
  if (hasWhatsApp)                        completenessScore += 20
  if (hasBio)                             completenessScore += 20
  if (hasAvatar)                          completenessScore += 20
  if (published.length >= 3)              completenessScore += 20
  if (withImages.length >= published.length * 0.8) completenessScore += 20

  const conversionPotential: "low" | "medium" | "high" =
    completenessScore >= 80 ? "high" :
    completenessScore >= 50 ? "medium" :
    "low"

  const topIssue =
    !hasWhatsApp ? "Add WhatsApp number to enable order button" :
    published.length === 0 ? "Add and publish at least one product" :
    !hasAvatar ? "Add a profile photo to build customer trust" :
    !hasBio ? "Write a store bio to tell your story" :
    published.length < 3 ? "Add more products — stores with 5+ products convert 3× better" :
    null

  const overallScore = Math.round(
    (completenessScore * 0.5) +
    (published.length >= 5 ? 30 : published.length * 6) +
    (hasWhatsApp ? 20 : 0)
  )

  return {
    creatorId,
    overallScore: Math.min(100, overallScore),
    productCount: products.length,
    publishedCount: published.length,
    hasWhatsApp,
    hasBio,
    hasAvatar,
    completenessScore,
    conversionPotential,
    topIssue,
  }
}

// ── Pricing Optimization ──────────────────────────────────────────────────────

export async function analyzePricingOpportunities(creatorId: string): Promise<{
  insights: string[]
  avgPriceKobo: number
  suggestedOptimization: string | null
}> {
  const supabase = createAdminClient()

  const { data: products } = await supabase
    .from("products")
    .select("price, is_published")
    .eq("creator_id", creatorId)
    .eq("is_published", true)
    .limit(50)

  const rows = (products ?? []) as { price: number }[]
  if (!rows.length) return { insights: ["No published products to analyze"], avgPriceKobo: 0, suggestedOptimization: null }

  const prices = rows.map(p => p.price)
  const avgPrice = prices.reduce((s, p) => s + p, 0) / prices.length
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  const insights: string[] = []
  let suggestedOptimization: string | null = null

  // Products < ₦1,000 are very likely underpriced
  const underpriced = prices.filter(p => p < 100_000).length  // price in kobo, ₦1000 = 100000 kobo
  if (underpriced > 0) {
    insights.push(`${underpriced} product(s) may be underpriced (<₦1,000) — consider testing higher price points`)
    suggestedOptimization = "Test a 10-15% price increase on your lower-priced products — most African buyers perceive higher price as higher quality"
  }

  if (maxPrice > avgPrice * 5) {
    insights.push("Large price spread detected — ensure your premium products are clearly differentiated")
  }

  if (rows.length === 1) {
    insights.push("Single product — add 2-3 complementary items to increase average order value")
    suggestedOptimization = "Add complementary products — stores with 3+ products see 2.4× higher average order values"
  }

  return { insights, avgPriceKobo: Math.round(avgPrice), suggestedOptimization }
}
