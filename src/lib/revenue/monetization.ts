import { createAdminClient } from "@/lib/supabase/server"

export interface PremiumReadinessScore {
  score: number
  tier: "starter" | "growth" | "pro" | "elite"
  signals: { label: string; met: boolean; weight: number }[]
  recommendations: string[]
}

export interface BundleRecommendation {
  productIds: string[]
  names: string[]
  suggestedPriceKobo: number
  estimatedLiftPct: number
  rationale: string
}

export interface UpsellPrompt {
  trigger: "post_purchase" | "cart_view" | "product_view" | "whatsapp_reply"
  productId: string
  productName: string
  priceKobo: number
  message: string
}

export interface MonetizationSegment {
  label: string
  creatorCount: number
  avgRevenueKobo: number
}

export async function getPremiumReadiness(creatorId: string): Promise<PremiumReadinessScore> {
  const supabase = createAdminClient()

  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [profileRes, ordersRes, productsRes, metricsRes] = await Promise.allSettled([
    supabase.from("creator_profiles").select("is_published, whatsapp_number, avatar_url, bio, custom_domain").eq("id", creatorId).maybeSingle(),
    supabase.from("orders").select("total_kobo, created_at").eq("creator_id", creatorId).in("status", ["paid", "completed", "fulfilled"]).gte("created_at", since30d),
    supabase.from("products").select("id, is_published").eq("creator_id", creatorId),
    supabase.from("creator_metrics_daily").select("storefront_views").eq("creator_id", creatorId).gte("date", since30d.split("T")[0]),
  ])

  const profile = profileRes.status === "fulfilled"
    ? (profileRes.value.data as { is_published: boolean; whatsapp_number: string | null; avatar_url: string | null; bio: string | null; custom_domain: string | null } | null)
    : null

  const orders = ordersRes.status === "fulfilled"
    ? (ordersRes.value.data as { total_kobo: number; created_at: string }[] | null) ?? []
    : []

  const products = productsRes.status === "fulfilled"
    ? (productsRes.value.data as { id: string; is_published: boolean }[] | null) ?? []
    : []

  const metrics = metricsRes.status === "fulfilled"
    ? (metricsRes.value.data as { storefront_views: number }[] | null) ?? []
    : []

  const revenueKobo = orders.reduce((s, o) => s + (o.total_kobo ?? 0), 0)
  const totalViews = metrics.reduce((s, m) => s + (m.storefront_views ?? 0), 0)
  const publishedProducts = products.filter(p => p.is_published).length

  const signals = [
    { label: "Store published", met: profile?.is_published === true, weight: 10 },
    { label: "WhatsApp connected", met: !!profile?.whatsapp_number, weight: 15 },
    { label: "Profile complete (avatar + bio)", met: !!profile?.avatar_url && !!profile?.bio, weight: 10 },
    { label: "5+ published products", met: publishedProducts >= 5, weight: 15 },
    { label: "1,000+ monthly views", met: totalViews >= 1000, weight: 20 },
    { label: "₦100k+ monthly revenue", met: revenueKobo >= 100_000_00, weight: 20 },
    { label: "Custom domain connected", met: !!profile?.custom_domain, weight: 10 },
  ]

  const score = signals.reduce((s, sig) => s + (sig.met ? sig.weight : 0), 0)

  let tier: PremiumReadinessScore["tier"] = "starter"
  if (score >= 80) tier = "elite"
  else if (score >= 60) tier = "pro"
  else if (score >= 35) tier = "growth"

  const recommendations: string[] = []
  if (!profile?.whatsapp_number) recommendations.push("Connect your WhatsApp number to enable instant orders")
  if (!profile?.avatar_url || !profile?.bio) recommendations.push("Complete your profile with a photo and bio")
  if (publishedProducts < 5) recommendations.push(`Add ${5 - publishedProducts} more published products`)
  if (totalViews < 1000) recommendations.push("Share your storefront link on social media to grow views")
  if (revenueKobo < 100_000_00) recommendations.push("Focus on WhatsApp follow-ups to convert more visitors")
  if (!profile?.custom_domain) recommendations.push("Connect a custom domain for professional credibility")

  return { score, tier, signals, recommendations }
}

export async function getBundleRecommendations(creatorId: string): Promise<BundleRecommendation[]> {
  const supabase = createAdminClient()

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, order_id, price_kobo")
    .eq("creator_id", creatorId)

  const items = (orderItems as { product_id: string; order_id: string; price_kobo: number }[] | null) ?? []
  if (items.length < 2) return []

  // Find products frequently bought together
  const orderProducts = new Map<string, Set<string>>()
  for (const item of items) {
    if (!orderProducts.has(item.order_id)) orderProducts.set(item.order_id, new Set())
    orderProducts.get(item.order_id)!.add(item.product_id)
  }

  const pairCounts = new Map<string, number>()
  for (const products of Array.from(orderProducts.values())) {
    const pArr = Array.from(products)
    for (let i = 0; i < pArr.length; i++) {
      for (let j = i + 1; j < pArr.length; j++) {
        const key = [pArr[i], pArr[j]].sort().join("|")
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
      }
    }
  }

  const topPairs = Array.from(pairCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  if (topPairs.length === 0) return []

  const productPrices = new Map(items.map(i => [i.product_id, i.price_kobo]))

  const { data: productNames } = await supabase
    .from("products")
    .select("id, name, price_kobo")
    .eq("creator_id", creatorId)
    .in("id", Array.from(new Set(items.map(i => i.product_id))))

  const nameMap = new Map(
    (productNames as { id: string; name: string; price_kobo: number }[] | null ?? [])
      .map(p => [p.id, { name: p.name, price: p.price_kobo }])
  )

  return topPairs.map(([key, count]) => {
    const [id1, id2] = key.split("|")
    const p1 = nameMap.get(id1)
    const p2 = nameMap.get(id2)
    const basePrice = (p1?.price ?? 0) + (p2?.price ?? 0)
    const discount = 0.1 // 10% bundle discount
    const suggestedPriceKobo = Math.round(basePrice * (1 - discount))

    return {
      productIds: [id1, id2],
      names: [p1?.name ?? id1, p2?.name ?? id2],
      suggestedPriceKobo,
      estimatedLiftPct: Math.min(25, count * 5),
      rationale: `Ordered together ${count}x — 10% bundle discount drives conversion`,
    }
  })
}

export async function getUpsellPrompts(creatorId: string): Promise<UpsellPrompt[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("products")
    .select("id, name, price_kobo")
    .eq("creator_id", creatorId)
    .eq("is_published", true)
    .order("price_kobo", { ascending: false })
    .limit(10)

  const products = (data as { id: string; name: string; price_kobo: number }[] | null) ?? []
  if (products.length === 0) return []

  const sorted = [...products].sort((a, b) => b.price_kobo - a.price_kobo)
  const topProduct = sorted[0]
  const midProduct = sorted[Math.floor(sorted.length / 2)]

  return [
    {
      trigger: "post_purchase",
      productId: topProduct.id,
      productName: topProduct.name,
      priceKobo: topProduct.price_kobo,
      message: `Thanks for your order! Many customers also love "${topProduct.name}". Add it to your order now?`,
    },
    {
      trigger: "whatsapp_reply",
      productId: midProduct.id,
      productName: midProduct.name,
      priceKobo: midProduct.price_kobo,
      message: `While you're here, check out "${midProduct.name}" — one of our bestsellers!`,
    },
  ]
}

export async function getMonetizationSegments(): Promise<MonetizationSegment[]> {
  const supabase = createAdminClient()
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const { data } = await supabase
    .from("orders")
    .select("creator_id, total_kobo")
    .in("status", ["paid", "completed", "fulfilled"])
    .gte("created_at", since30d)

  const orders = (data as { creator_id: string; total_kobo: number }[] | null) ?? []

  const creatorRevenue = new Map<string, number>()
  for (const o of orders) {
    creatorRevenue.set(o.creator_id, (creatorRevenue.get(o.creator_id) ?? 0) + (o.total_kobo ?? 0))
  }

  const revenues = Array.from(creatorRevenue.values())
  const tiers = [
    { label: "No revenue", min: 0, max: 0 },
    { label: "Micro (₦1–₦50k)", min: 1, max: 50_000_00 },
    { label: "Growing (₦50k–₦500k)", min: 50_000_01, max: 500_000_00 },
    { label: "Established (₦500k+)", min: 500_000_01, max: Infinity },
  ]

  return tiers.map(tier => {
    const inTier = revenues.filter(r => r >= tier.min && r <= tier.max)
    const avgRevenueKobo = inTier.length > 0 ? Math.round(inTier.reduce((s, r) => s + r, 0) / inTier.length) : 0
    return { label: tier.label, creatorCount: inTier.length, avgRevenueKobo }
  })
}
