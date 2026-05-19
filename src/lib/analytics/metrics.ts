import { createAdminClient } from "@/lib/supabase/server"

export interface CreatorGrowthMetrics {
  totalCreators: number
  publishedCreators: number
  creatorsWithProducts: number
  creatorsWithSales: number
  avgActivationScore: number
  newCreators30d: number
}

export async function getCreatorGrowthMetrics(): Promise<CreatorGrowthMetrics> {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [totalRes, publishedRes, productRes, salesRes, newRes] = await Promise.allSettled([
    supabase.from("creator_profiles").select("id", { count: "exact", head: true }),
    supabase.from("creator_profiles").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("creator_profiles").select("id", { count: "exact", head: true }).not("first_product_added_at", "is", null),
    supabase.from("creator_profiles").select("id", { count: "exact", head: true }).not("first_sale_at", "is", null),
    supabase.from("creator_profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
  ])

  const get = (r: PromiseSettledResult<{ count: number | null }>): number =>
    r.status === "fulfilled" ? (r.value.count ?? 0) : 0

  const total     = get(totalRes as PromiseSettledResult<{ count: number | null }>)
  const published = get(publishedRes as PromiseSettledResult<{ count: number | null }>)
  const withProd  = get(productRes as PromiseSettledResult<{ count: number | null }>)
  const withSales = get(salesRes as PromiseSettledResult<{ count: number | null }>)
  const newCreators = get(newRes as PromiseSettledResult<{ count: number | null }>)

  // Rough activation score: 5 steps, each worth 20pts
  const steps = [total, withProd, published, withSales]
  const avgScore = total > 0
    ? Math.round(((published / total) * 40 + (withProd / total) * 30 + (withSales / total) * 30))
    : 0

  return {
    totalCreators: total,
    publishedCreators: published,
    creatorsWithProducts: withProd,
    creatorsWithSales: withSales,
    avgActivationScore: avgScore,
    newCreators30d: newCreators,
  }
}

export interface PlatformMetrics {
  totalOrders: number
  totalRevenue: number   // in kobo
  totalAIGenerations: number
  totalWhatsAppClicks: number
  avgOrderValueKobo: number
}

export async function getPlatformMetrics(since?: Date): Promise<PlatformMetrics> {
  const supabase = createAdminClient()
  const sinceDate = (since ?? new Date(Date.now() - 30 * 86_400_000)).toISOString()

  const [ordersRes, aiRes, waRes] = await Promise.allSettled([
    supabase.from("orders").select("total_amount").gte("created_at", sinceDate).eq("payment_status", "paid"),
    supabase.from("ai_generations").select("id", { count: "exact", head: true }).gte("created_at", sinceDate),
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).gte("created_at", sinceDate),
  ])

  let totalOrders = 0, totalRevenue = 0
  if (ordersRes.status === "fulfilled" && ordersRes.value.data) {
    const rows = ordersRes.value.data as { total_amount: number }[]
    totalOrders = rows.length
    totalRevenue = rows.reduce((s, r) => s + (r.total_amount ?? 0), 0)
  }

  const totalAI = aiRes.status === "fulfilled" ? (aiRes.value.count ?? 0) : 0
  const totalWA = waRes.status === "fulfilled" ? (waRes.value.count ?? 0) : 0

  return {
    totalOrders,
    totalRevenue,
    totalAIGenerations: totalAI,
    totalWhatsAppClicks: totalWA,
    avgOrderValueKobo: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
  }
}
