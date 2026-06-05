import { createAdminClient } from "@/lib/supabase/server"
import { generatePricingSuggestion } from "@/lib/ai/commerce"

export interface CreatorRevenueSummary {
  creatorId: string
  totalRevenueKobo: number
  totalOrders: number
  avgOrderValueKobo: number
  revenueThisMonth: number
  revenueLastMonth: number
  monthOverMonthPct: number
  topProductId: string | null
  conversionRate: number   // orders / storefront views (%)
}

export async function getCreatorRevenueSummary(creatorId: string): Promise<CreatorRevenueSummary> {
  const supabase = createAdminClient()
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [allOrdersRes, thisMonthRes, lastMonthRes, topProductRes, metricsRes] = await Promise.allSettled([
    supabase.from("orders").select("total_amount").eq("creator_id", creatorId).eq("payment_status", "paid"),
    supabase.from("orders").select("total_amount").eq("creator_id", creatorId).eq("payment_status", "paid").gte("created_at", thisMonthStart),
    supabase.from("orders").select("total_amount").eq("creator_id", creatorId).eq("payment_status", "paid").gte("created_at", lastMonthStart).lt("created_at", thisMonthStart),
    supabase.from("orders").select("product_id").eq("creator_id", creatorId).eq("payment_status", "paid").order("created_at", { ascending: false }).limit(50),
    supabase.from("creator_metrics_daily").select("storefront_views, orders_created").eq("creator_id", creatorId).gte("date", new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]).limit(30),
  ])

  const sumKobo = (res: PromiseSettledResult<{ data: { total_amount: number }[] | null }>): number => {
    if (res.status !== "fulfilled" || !res.value.data) return 0
    return res.value.data.reduce((s, r) => s + (r.total_amount ?? 0), 0)
  }

  const allOrders = allOrdersRes.status === "fulfilled" ? (allOrdersRes.value.data ?? []) : []
  const totalRevenue = allOrders.reduce((s, r) => s + (r.total_amount ?? 0), 0)
  const totalOrders = allOrders.length
  const thisMonth = sumKobo(thisMonthRes as PromiseSettledResult<{ data: { total_amount: number }[] | null }>)
  const lastMonth = sumKobo(lastMonthRes as PromiseSettledResult<{ data: { total_amount: number }[] | null }>)
  const mom = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : (thisMonth > 0 ? 100 : 0)

  // Top product by order count
  let topProductId: string | null = null
  if (topProductRes.status === "fulfilled" && topProductRes.value.data) {
    const counts = new Map<string, number>()
    for (const row of topProductRes.value.data as { product_id: string }[]) {
      counts.set(row.product_id, (counts.get(row.product_id) ?? 0) + 1)
    }
    topProductId = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  }

  // Conversion rate
  let conversionRate = 0
  if (metricsRes.status === "fulfilled" && metricsRes.value.data) {
    const rows = metricsRes.value.data as { storefront_views: number; orders_created: number }[]
    const totalViews = rows.reduce((s, r) => s + (r.storefront_views ?? 0), 0)
    const totalOrd = rows.reduce((s, r) => s + (r.orders_created ?? 0), 0)
    conversionRate = totalViews > 0 ? Math.round((totalOrd / totalViews) * 100 * 10) / 10 : 0
  }

  return {
    creatorId,
    totalRevenueKobo: totalRevenue,
    totalOrders,
    avgOrderValueKobo: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    revenueThisMonth: thisMonth,
    revenueLastMonth: lastMonth,
    monthOverMonthPct: mom,
    topProductId,
    conversionRate,
  }
}

export interface RevenueOpportunity {
  type: "pricing" | "product_gap" | "cta" | "publish" | "whatsapp"
  title: string
  description: string
  estimatedUplift: string
  priority: "high" | "medium" | "low"
}

export async function getRevenueOpportunities(creatorId: string): Promise<RevenueOpportunity[]> {
  const supabase = createAdminClient()
  const opps: RevenueOpportunity[] = []

  const [profileRes, productRes] = await Promise.allSettled([
    supabase.from("creator_profiles").select("is_published, whatsapp_number, first_sale_at").eq("id", creatorId).maybeSingle(),
    supabase.from("products").select("id, name, price, is_published, currency").eq("creator_id", creatorId).limit(20),
  ])

  const profile = profileRes.status === "fulfilled"
    ? (profileRes.value.data as { is_published: boolean; whatsapp_number: string | null; first_sale_at: string | null } | null)
    : null

  const products = productRes.status === "fulfilled"
    ? (productRes.value.data as { id: string; name: string; price: number; is_published: boolean; currency: string }[] | null) ?? []
    : []

  if (!profile?.is_published) {
    opps.push({ type: "publish", title: "Publish your store", description: "Unpublished stores cannot be found by buyers.", estimatedUplift: "+100% visibility", priority: "high" })
  }

  if (!profile?.whatsapp_number) {
    opps.push({ type: "whatsapp", title: "Add WhatsApp", description: "WhatsApp checkout converts 40% better than link-only stores.", estimatedUplift: "+40% conversions", priority: "high" })
  }

  if (!profile?.first_sale_at && products.length > 0 && profile?.is_published) {
    opps.push({ type: "cta", title: "Optimize your CTA", description: "\"Order on WhatsApp\" outperforms generic buy buttons by 2×.", estimatedUplift: "2× click-through", priority: "medium" })
  }

  // Check for underpriced products
  for (const p of products.filter(p => p.is_published).slice(0, 3)) {
    const suggestion = generatePricingSuggestion({
      productName: p.name,
      currentPriceKobo: p.price,
      niche: "general",
      currency: p.currency ?? "USD",
    })
    if (suggestion.suggestedPrice > suggestion.currentPrice) {
      opps.push({
        type: "pricing",
        title: `Raise price on "${p.name}"`,
        description: suggestion.reasoning,
        estimatedUplift: `+${Math.round((suggestion.suggestedPrice - suggestion.currentPrice) / suggestion.currentPrice * 100)}% revenue`,
        priority: suggestion.confidence === "high" ? "high" : "medium",
      })
      break // One pricing opp max
    }
  }

  const unpublishedProducts = products.filter(p => !p.is_published)
  if (unpublishedProducts.length > 0) {
    opps.push({
      type: "product_gap",
      title: `Publish ${unpublishedProducts.length} draft product${unpublishedProducts.length > 1 ? "s" : ""}`,
      description: "Draft products are invisible to buyers. Each published product increases discovery.",
      estimatedUplift: "+draft-to-sale conversions",
      priority: "medium",
    })
  }

  return opps.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority])).slice(0, 4)
}

export async function getPlatformRevenueTrend(days = 14): Promise<{ date: string; revenueKobo: number; orders: number }[]> {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - days * 86_400_000).toISOString()

  const { data } = await supabase
    .from("orders")
    .select("total_amount, created_at")
    .eq("payment_status", "paid")
    .gte("created_at", since)

  const buckets = new Map<string, { revenueKobo: number; orders: number }>()
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 86_400_000).toISOString().split("T")[0]
    buckets.set(d, { revenueKobo: 0, orders: 0 })
  }

  for (const row of (data as { total_amount: number; created_at: string }[] | null) ?? []) {
    const d = row.created_at.split("T")[0]
    const b = buckets.get(d)
    if (b) { b.revenueKobo += row.total_amount; b.orders++ }
  }

  return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }))
}
