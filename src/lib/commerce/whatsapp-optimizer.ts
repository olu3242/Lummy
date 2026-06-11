import { createAdminClient } from "@/lib/supabase/server"

export interface WhatsAppCTAStats {
  weeklyClicks: number
  weeklyViews: number
  clickThroughRate: number
  attributedRevenue: number
  topSource: string | null
  trend: "up" | "stable" | "down"
}

export interface WhatsAppOptimizationHint {
  type: "cta_text" | "timing" | "platform" | "share_frequency" | "message_template"
  title: string
  suggestion: string
  impact: "high" | "medium" | "low"
}

export interface PlatformWhatsAppSummary {
  totalClicksLast7d: number
  totalClicksLast30d: number
  avgCTRBySource: Record<string, number>
  topCreatorsByClicks: Array<{ handle: string; clicks: number }>
}

export async function getCreatorWhatsAppStats(creatorId: string): Promise<WhatsAppCTAStats> {
  const supabase = createAdminClient()

  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]
  const since14d = new Date(Date.now() - 14 * 86_400_000).toISOString().split("T")[0]

  const [metrics7dRes, metrics14dRes, attributionsRes] = await Promise.allSettled([
    supabase.from("creator_metrics_daily")
      .select("storefront_views, whatsapp_clicks, date")
      .eq("creator_id", creatorId)
      .gte("date", since7d),
    supabase.from("creator_metrics_daily")
      .select("whatsapp_clicks, date")
      .eq("creator_id", creatorId)
      .gte("date", since14d)
      .lt("date", since7d),
    supabase.from("campaign_attributions")
      .select("source, attributed_revenue_kobo, converted_at")
      .eq("creator_id", creatorId)
      .gte("clicked_at", `${since7d}T00:00:00Z`),
  ])

  const metrics7d = metrics7dRes.status === "fulfilled"
    ? (metrics7dRes.value.data as { storefront_views: number; whatsapp_clicks: number; date: string }[] | null) ?? []
    : []

  const metrics14d = metrics14dRes.status === "fulfilled"
    ? (metrics14dRes.value.data as { whatsapp_clicks: number; date: string }[] | null) ?? []
    : []

  const attributions = attributionsRes.status === "fulfilled"
    ? (attributionsRes.value.data as { source: string; attributed_revenue_kobo: number; converted_at: string | null }[] | null) ?? []
    : []

  const weeklyClicks = metrics7d.reduce((s, m) => s + (m.whatsapp_clicks ?? 0), 0)
  const weeklyViews = metrics7d.reduce((s, m) => s + (m.storefront_views ?? 0), 0)
  const priorWeekClicks = metrics14d.reduce((s, m) => s + (m.whatsapp_clicks ?? 0), 0)

  const clickThroughRate = weeklyViews > 0
    ? Math.round(weeklyClicks / weeklyViews * 100 * 10) / 10
    : 0

  const attributedRevenue = attributions
    .filter(a => a.converted_at)
    .reduce((s, a) => s + (a.attributed_revenue_kobo ?? 0), 0)

  const sourceCounts = new Map<string, number>()
  for (const a of attributions) sourceCounts.set(a.source, (sourceCounts.get(a.source) ?? 0) + 1)
  const topSource = Array.from(sourceCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const trend: WhatsAppCTAStats["trend"] =
    weeklyClicks > priorWeekClicks * 1.1 ? "up" :
    weeklyClicks < priorWeekClicks * 0.9 ? "down" : "stable"

  return { weeklyClicks, weeklyViews, clickThroughRate, attributedRevenue, topSource, trend }
}

export function getWhatsAppOptimizationHints(stats: WhatsAppCTAStats): WhatsAppOptimizationHint[] {
  const hints: WhatsAppOptimizationHint[] = []

  if (stats.clickThroughRate < 3 && stats.weeklyViews > 50) {
    hints.push({
      type: "cta_text",
      title: "Upgrade your CTA copy",
      suggestion: "Replace generic 'Order here' with 'Chat with me on WhatsApp to order now ⚡' — urgency words increase clicks by 30%.",
      impact: "high",
    })
  }

  if (stats.weeklyViews < 100) {
    hints.push({
      type: "share_frequency",
      title: "Share more consistently",
      suggestion: "Post your store link on Instagram Stories and WhatsApp Status at least 3× per week. Most clicks come within 1 hour of sharing.",
      impact: "high",
    })
  }

  if (stats.topSource === "direct" || !stats.topSource) {
    hints.push({
      type: "platform",
      title: "Diversify your traffic sources",
      suggestion: "Add your store link to your TikTok bio and Instagram bio. These drive steady passive traffic.",
      impact: "medium",
    })
  }

  if (stats.weeklyClicks > 0 && stats.attributedRevenue === 0) {
    hints.push({
      type: "message_template",
      title: "Follow up on WhatsApp chats",
      suggestion: "Send a follow-up message within 24 hours: 'Hi! Just checking if you had any questions about [product] 😊'. Most sales happen after 2+ touchpoints.",
      impact: "high",
    })
  }

  if (stats.trend === "down") {
    hints.push({
      type: "timing",
      title: "Your clicks are declining",
      suggestion: "Post your storefront link between 7–9pm on weekdays — that's when buyers are most active in Nigeria.",
      impact: "medium",
    })
  }

  return hints.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.impact] - order[b.impact]
  })
}

export async function getPlatformWhatsAppSummary(): Promise<PlatformWhatsAppSummary> {
  const supabase = createAdminClient()
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]

  const [clicks7dRes, clicks30dRes, attrRes, profilesRes] = await Promise.allSettled([
    supabase.from("creator_metrics_daily").select("whatsapp_clicks").gte("date", since7d),
    supabase.from("creator_metrics_daily").select("whatsapp_clicks").gte("date", since30d),
    supabase.from("campaign_attributions").select("source, creator_id").gte("clicked_at", `${since7d}T00:00:00Z`),
    supabase.from("creator_metrics_daily")
      .select("creator_id, whatsapp_clicks")
      .gte("date", since7d)
      .order("whatsapp_clicks", { ascending: false })
      .limit(50),
  ])

  const clicks7d = clicks7dRes.status === "fulfilled"
    ? (clicks7dRes.value.data as { whatsapp_clicks: number }[] | null) ?? []
    : []
  const clicks30d = clicks30dRes.status === "fulfilled"
    ? (clicks30dRes.value.data as { whatsapp_clicks: number }[] | null) ?? []
    : []
  const attrs = attrRes.status === "fulfilled"
    ? (attrRes.value.data as { source: string; creator_id: string }[] | null) ?? []
    : []
  const byCreator = profilesRes.status === "fulfilled"
    ? (profilesRes.value.data as { creator_id: string; whatsapp_clicks: number }[] | null) ?? []
    : []

  const totalClicksLast7d = clicks7d.reduce((s, m) => s + (m.whatsapp_clicks ?? 0), 0)
  const totalClicksLast30d = clicks30d.reduce((s, m) => s + (m.whatsapp_clicks ?? 0), 0)

  const sourceCounts = new Map<string, { clicks: number; views: number }>()
  for (const a of attrs) {
    if (!sourceCounts.has(a.source)) sourceCounts.set(a.source, { clicks: 0, views: 0 })
    sourceCounts.get(a.source)!.clicks++
  }
  const avgCTRBySource: Record<string, number> = {}
  for (const [source, data] of Array.from(sourceCounts.entries())) {
    avgCTRBySource[source] = data.clicks
  }

  // Top creators by clicks — need handles
  const topCreatorIds = byCreator.slice(0, 5).map(r => r.creator_id)
  const creatorClickMap = new Map(byCreator.map(r => [r.creator_id, r.whatsapp_clicks]))

  let topCreatorsByClicks: Array<{ handle: string; clicks: number }> = []
  if (topCreatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("creator_profiles")
      .select("id, handle")
      .in("id", topCreatorIds)

    topCreatorsByClicks = (profiles as { id: string; handle: string }[] | null ?? [])
      .map(p => ({ handle: p.handle, clicks: creatorClickMap.get(p.id) ?? 0 }))
      .sort((a, b) => b.clicks - a.clicks)
  }

  return { totalClicksLast7d, totalClicksLast30d, avgCTRBySource, topCreatorsByClicks }
}
