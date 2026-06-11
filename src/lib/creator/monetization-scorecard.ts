import { createAdminClient } from "@/lib/supabase/server"

export type MonetizationGrade = "A" | "B" | "C" | "D" | "F"

export interface MonetizationScorecard {
  grade: MonetizationGrade
  score: number                 // 0-100
  revenueThisMonthKobo: number
  monthOverMonthPct: number
  totalOrders: number
  conversionRate: number
  velocityTrend: "accelerating" | "steady" | "slowing" | "inactive"
  signals: Array<{ label: string; value: string; positive: boolean }>
  topPriority: string
  monetizationMilestones: string[]
}

export interface PlatformMonetizationSummary {
  creatorsWithSales: number
  creatorsNoSales: number
  topTierCount: number  // grade A+B
  avgMonthlyRevenueKobo: number
  recentMilestones: Array<{ creatorId: string; milestoneKey: string; achievedAt: string }>
}

const MONETIZATION_MILESTONES = [
  { key: "first_sale",     label: "First Sale",      threshold: 1,          isOrderCount: true },
  { key: "orders_10",      label: "10 Orders",       threshold: 10,         isOrderCount: true },
  { key: "orders_50",      label: "50 Orders",       threshold: 50,         isOrderCount: true },
  { key: "revenue_10k",    label: "₦10k revenue",    threshold: 10_000_00,  isOrderCount: false },
  { key: "revenue_100k",   label: "₦100k revenue",   threshold: 100_000_00, isOrderCount: false },
  { key: "revenue_1m",     label: "₦1m revenue",     threshold: 1_000_000_00, isOrderCount: false },
]

export async function computeMonetizationScorecard(creatorId: string): Promise<MonetizationScorecard> {
  const supabase = createAdminClient()

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]
  const since14d = new Date(Date.now() - 14 * 86_400_000).toISOString().split("T")[0]

  const [allOrdersRes, thisMonthRes, lastMonthRes, metricsRes, milestoneRes] = await Promise.allSettled([
    supabase.from("orders").select("id, total_kobo, created_at")
      .eq("creator_id", creatorId).in("status", ["paid", "completed", "fulfilled"]),
    supabase.from("orders").select("total_kobo")
      .eq("creator_id", creatorId).in("status", ["paid", "completed", "fulfilled"])
      .gte("created_at", thisMonthStart),
    supabase.from("orders").select("total_kobo")
      .eq("creator_id", creatorId).in("status", ["paid", "completed", "fulfilled"])
      .gte("created_at", lastMonthStart).lt("created_at", thisMonthStart),
    supabase.from("creator_metrics_daily").select("storefront_views, orders_completed")
      .eq("creator_id", creatorId).gte("date", since30d),
    supabase.from("creator_monetization_milestones").select("milestone_key")
      .eq("creator_id", creatorId),
  ])

  const allOrders = allOrdersRes.status === "fulfilled"
    ? (allOrdersRes.value.data as { id: string; total_kobo: number; created_at: string }[] | null) ?? []
    : []
  const thisMonth = thisMonthRes.status === "fulfilled"
    ? (thisMonthRes.value.data as { total_kobo: number }[] | null) ?? []
    : []
  const lastMonth = lastMonthRes.status === "fulfilled"
    ? (lastMonthRes.value.data as { total_kobo: number }[] | null) ?? []
    : []
  const metrics = metricsRes.status === "fulfilled"
    ? (metricsRes.value.data as { storefront_views: number; orders_completed: number }[] | null) ?? []
    : []
  const existingMilestones = new Set(
    milestoneRes.status === "fulfilled"
      ? (milestoneRes.value.data as { milestone_key: string }[] | null ?? []).map(m => m.milestone_key)
      : []
  )

  const totalOrders = allOrders.length
  const totalRevenueKobo = allOrders.reduce((s, o) => s + (o.total_kobo ?? 0), 0)
  const revenueThisMonthKobo = thisMonth.reduce((s, o) => s + (o.total_kobo ?? 0), 0)
  const revenueLastMonthKobo = lastMonth.reduce((s, o) => s + (o.total_kobo ?? 0), 0)
  const monthOverMonthPct = revenueLastMonthKobo > 0
    ? Math.round(((revenueThisMonthKobo - revenueLastMonthKobo) / revenueLastMonthKobo) * 100)
    : revenueThisMonthKobo > 0 ? 100 : 0

  const totalViews = metrics.reduce((s, m) => s + (m.storefront_views ?? 0), 0)
  const totalOrdersFromMetrics = metrics.reduce((s, m) => s + (m.orders_completed ?? 0), 0)
  const conversionRate = totalViews > 0
    ? Math.round(totalOrdersFromMetrics / totalViews * 100 * 10) / 10
    : 0

  // Velocity: compare first 14d vs last 14d of 30d window
  const first14Orders = allOrders.filter(o => {
    const d = new Date(o.created_at).getTime()
    return d >= Date.now() - 30 * 86_400_000 && d < Date.now() - 14 * 86_400_000
  }).length
  const last14Orders = allOrders.filter(o =>
    new Date(o.created_at).getTime() >= Date.now() - 14 * 86_400_000
  ).length

  const velocityTrend: MonetizationScorecard["velocityTrend"] =
    totalOrders === 0 ? "inactive" :
    last14Orders > first14Orders * 1.2 ? "accelerating" :
    last14Orders < first14Orders * 0.8 ? "slowing" : "steady"

  // Score
  let score = 0
  if (totalOrders > 0)                     score += 20
  if (revenueThisMonthKobo > 0)            score += 20
  if (monthOverMonthPct >= 10)             score += 15
  if (conversionRate >= 2)                 score += 15
  if (velocityTrend === "accelerating")    score += 15
  else if (velocityTrend === "steady")     score += 8
  if (totalOrders >= 10)                   score += 10
  if (revenueThisMonthKobo >= 100_000_00)  score += 5

  const grade: MonetizationGrade =
    score >= 85 ? "A" : score >= 65 ? "B" : score >= 45 ? "C" : score >= 25 ? "D" : "F"

  const signals: MonetizationScorecard["signals"] = [
    { label: "Monthly revenue", value: `₦${(revenueThisMonthKobo / 100).toLocaleString()}`, positive: revenueThisMonthKobo > 0 },
    { label: "Month-over-month", value: `${monthOverMonthPct >= 0 ? "+" : ""}${monthOverMonthPct}%`, positive: monthOverMonthPct >= 0 },
    { label: "Conversion rate", value: `${conversionRate}%`, positive: conversionRate >= 2 },
    { label: "Velocity", value: velocityTrend, positive: velocityTrend === "accelerating" || velocityTrend === "steady" },
  ]

  const topPriority =
    totalOrders === 0 ? "Focus on getting your first sale" :
    revenueThisMonthKobo === 0 ? "Reactivate your store traffic" :
    conversionRate < 2 ? "Improve your storefront conversion rate" :
    velocityTrend === "slowing" ? "Re-engage with your audience" :
    "Keep the momentum — expand your product range"

  // Award new milestones (fire-and-forget)
  const newMilestones: Array<{ milestone_key: string; value_kobo: number }> = []
  for (const m of MONETIZATION_MILESTONES) {
    if (existingMilestones.has(m.key)) continue
    const met = m.isOrderCount ? totalOrders >= m.threshold : totalRevenueKobo >= m.threshold
    if (met) newMilestones.push({ milestone_key: m.key, value_kobo: totalRevenueKobo })
  }
  if (newMilestones.length > 0) {
    void Promise.resolve(
      supabase.from("creator_monetization_milestones").upsert(
        newMilestones.map(m => ({ creator_id: creatorId, ...m }))
      )
    ).catch(() => {})
  }

  const monetizationMilestones = [
    ...Array.from(existingMilestones),
    ...newMilestones.map(m => m.milestone_key),
  ]

  return {
    grade, score, revenueThisMonthKobo, monthOverMonthPct, totalOrders,
    conversionRate, velocityTrend, signals, topPriority, monetizationMilestones,
  }
}

export async function getPlatformMonetizationSummary(): Promise<PlatformMonetizationSummary> {
  const supabase = createAdminClient()
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [profilesRes, ordersRes, milestonesRes] = await Promise.allSettled([
    supabase.from("creator_profiles").select("id, first_sale_at").limit(1000),
    supabase.from("orders").select("creator_id, total_kobo")
      .in("status", ["paid", "completed", "fulfilled"])
      .gte("created_at", thisMonthStart),
    supabase.from("creator_monetization_milestones")
      .select("creator_id, milestone_key, achieved_at")
      .order("achieved_at", { ascending: false })
      .limit(20),
  ])

  const profiles = profilesRes.status === "fulfilled"
    ? (profilesRes.value.data as { id: string; first_sale_at: string | null }[] | null) ?? []
    : []
  const orders = ordersRes.status === "fulfilled"
    ? (ordersRes.value.data as { creator_id: string; total_kobo: number }[] | null) ?? []
    : []
  const milestones = milestonesRes.status === "fulfilled"
    ? (milestonesRes.value.data as { creator_id: string; milestone_key: string; achieved_at: string }[] | null) ?? []
    : []

  const creatorsWithSales = profiles.filter(p => p.first_sale_at).length
  const creatorsNoSales = profiles.length - creatorsWithSales

  const revenueByCreator = new Map<string, number>()
  for (const o of orders) {
    revenueByCreator.set(o.creator_id, (revenueByCreator.get(o.creator_id) ?? 0) + (o.total_kobo ?? 0))
  }

  const revenues = Array.from(revenueByCreator.values())
  const avgMonthlyRevenueKobo = revenues.length > 0
    ? Math.round(revenues.reduce((s, r) => s + r, 0) / revenues.length)
    : 0

  const topTierCount = revenues.filter(r => r >= 50_000_00).length

  return {
    creatorsWithSales,
    creatorsNoSales,
    topTierCount,
    avgMonthlyRevenueKobo,
    recentMilestones: milestones.slice(0, 5).map(m => ({
      creatorId: m.creator_id,
      milestoneKey: m.milestone_key,
      achievedAt: m.achieved_at,
    })),
  }
}
