import { createAdminClient } from "@/lib/supabase/server"

export interface TrendingCreator {
  creatorId: string
  handle: string
  displayName: string
  niche: string | null
  avatarUrl: string | null
  trendScore: number
  storeFrontViews7d: number
  whatsappClicks7d: number
  recentSales: number
}

export async function getTrendingCreators(limit = 10): Promise<TrendingCreator[]> {
  const supabase = createAdminClient()
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]

  const [metricsRes, profilesRes] = await Promise.allSettled([
    supabase.from("creator_metrics_daily")
      .select("creator_id, storefront_views, whatsapp_clicks, orders_completed")
      .gte("date", since7d),
    supabase.from("creator_profiles")
      .select("id, handle, display_name, niche, avatar_url")
      .eq("is_published", true)
      .limit(200),
  ])

  if (metricsRes.status !== "fulfilled" || profilesRes.status !== "fulfilled") return []

  const metrics = metricsRes.value.data as { creator_id: string; storefront_views: number; whatsapp_clicks: number; orders_completed: number }[] | null ?? []
  const profiles = profilesRes.value.data as { id: string; handle: string; display_name: string; niche: string | null; avatar_url: string | null }[] | null ?? []

  // Aggregate metrics per creator
  const agg = new Map<string, { views: number; wa: number; sales: number }>()
  for (const m of metrics) {
    if (!agg.has(m.creator_id)) agg.set(m.creator_id, { views: 0, wa: 0, sales: 0 })
    const a = agg.get(m.creator_id)!
    a.views += m.storefront_views ?? 0
    a.wa += m.whatsapp_clicks ?? 0
    a.sales += m.orders_completed ?? 0
  }

  // Score: views×1 + wa×3 + sales×10
  return profiles
    .map(p => {
      const a = agg.get(p.id) ?? { views: 0, wa: 0, sales: 0 }
      const trendScore = a.views + a.wa * 3 + a.sales * 10
      return {
        creatorId: p.id,
        handle: p.handle,
        displayName: p.display_name,
        niche: p.niche,
        avatarUrl: p.avatar_url,
        trendScore,
        storeFrontViews7d: a.views,
        whatsappClicks7d: a.wa,
        recentSales: a.sales,
      }
    })
    .filter(c => c.trendScore > 0)
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, limit)
}

export async function getCreatorsByNiche(niche: string, limit = 20): Promise<Array<{ id: string; handle: string; displayName: string; avatarUrl: string | null }>> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("creator_profiles")
    .select("id, handle, display_name, avatar_url")
    .eq("is_published", true)
    .ilike("niche", `%${niche}%`)
    .limit(limit)

  return (data as { id: string; handle: string; display_name: string; avatar_url: string | null }[] | null ?? [])
    .map(p => ({ id: p.id, handle: p.handle, displayName: p.display_name, avatarUrl: p.avatar_url }))
}

export async function getSocialConversionStats(creatorId: string): Promise<{
  totalAttributedClicks: number
  totalAttributedRevenue: number
  topSource: string | null
  conversionRate: number
}> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("campaign_attributions")
    .select("source, attributed_revenue_kobo, converted_at")
    .eq("creator_id", creatorId)

  const rows = (data as { source: string; attributed_revenue_kobo: number; converted_at: string | null }[] | null) ?? []
  const totalClicks = rows.length
  const converted = rows.filter(r => r.converted_at)
  const totalRevenue = converted.reduce((s, r) => s + (r.attributed_revenue_kobo ?? 0), 0)

  // Top source
  const sourceCounts = new Map<string, number>()
  for (const r of rows) sourceCounts.set(r.source, (sourceCounts.get(r.source) ?? 0) + 1)
  const topSource = Array.from(sourceCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    totalAttributedClicks: totalClicks,
    totalAttributedRevenue: totalRevenue,
    topSource,
    conversionRate: totalClicks > 0 ? Math.round(converted.length / totalClicks * 100 * 10) / 10 : 0,
  }
}

export async function trackCampaignClick(opts: {
  creatorId: string
  source: string
  medium?: string
  campaignId?: string
  utmContent?: string
}): Promise<void> {
  const supabase = createAdminClient()
  void Promise.resolve(
    supabase.from("campaign_attributions").insert({
      creator_id: opts.creatorId,
      campaign_id: opts.campaignId ?? null,
      source: opts.source,
      medium: opts.medium ?? null,
      utm_content: opts.utmContent ?? null,
    })
  ).catch(() => {})
}

export async function attributeOrderToClick(orderId: string, creatorId: string, revenueKobo: number): Promise<void> {
  const supabase = createAdminClient()
  // Find most recent unattributed click within 24h
  const since = new Date(Date.now() - 86_400_000).toISOString()
  const { data } = await supabase
    .from("campaign_attributions")
    .select("id")
    .eq("creator_id", creatorId)
    .is("attributed_order_id", null)
    .gte("clicked_at", since)
    .order("clicked_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return
  const row = data as { id: string }

  void Promise.resolve(
    supabase.from("campaign_attributions").update({
      attributed_order_id: orderId,
      attributed_revenue_kobo: revenueKobo,
      converted_at: new Date().toISOString(),
    }).eq("id", row.id)
  ).catch(() => {})
}
