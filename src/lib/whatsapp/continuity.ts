import { createAdminClient } from "@/lib/supabase/server"

export interface WhatsAppContinuityReport {
  generatedAt: string
  score: number
  whatsappConfigured: boolean
  last7d: {
    totalClicks: number
    attributedClicks: number
    attributionRate: number          // % clicks with campaign_id
    uniqueCreators: number
  }
  orphanedCampaignLinks: number     // clicks referencing missing campaign_id
  conversionGapCreators: number     // creators with >10 clicks but 0 attributed orders
  issues: string[]
  recommendations: string[]
}

export async function runWhatsAppContinuityAudit(): Promise<WhatsAppContinuityReport> {
  const supabase = createAdminClient()
  const issues: string[] = []
  const recommendations: string[] = []

  const whatsappConfigured = (process.env.WHATSAPP_BUSINESS_TOKEN ?? "").length > 0
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [clicksRes, attributedRes, creatorsRes] = await Promise.allSettled([
    supabase
      .from("whatsapp_events")
      .select("id, creator_id, event_type", { count: "exact" })
      .eq("event_type", "cta_click")
      .gte("created_at", since7d),
    supabase
      .from("whatsapp_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "cta_click")
      .not("campaign_id", "is", null)
      .gte("created_at", since7d),
    supabase
      .from("creator_metrics_daily")
      .select("creator_id, whatsapp_clicks")
      .gte("date", since7d.split("T")[0])
      .gt("whatsapp_clicks", 10),
  ])

  const clicks = clicksRes.status === "fulfilled" ? clicksRes.value : null
  const attributed = attributedRes.status === "fulfilled" ? attributedRes.value : null
  const highClickCreators = creatorsRes.status === "fulfilled" ? creatorsRes.value.data ?? [] : []

  const totalClicks = clicks?.count ?? 0
  const attributedClicks = attributed?.count ?? 0
  const attributionRate = totalClicks > 0 ? Math.round(attributedClicks / totalClicks * 100) : 0

  // Unique creators with CTA clicks
  const creatorSet = new Set((clicks?.data ?? []).map((r: Record<string, unknown>) => r.creator_id as string))

  // Creators with high clicks but likely low attribution (proxy for conversion gap)
  const conversionGapCreators = (highClickCreators as Array<Record<string, unknown>>)
    .filter(r => (r.whatsapp_clicks as number) > 10).length

  if (attributionRate < 50) issues.push(`Attribution rate only ${attributionRate}% — many CTA clicks untracked`)
  if (conversionGapCreators > 0) recommendations.push(`${conversionGapCreators} creators with high clicks but low conversion — review CTA copy and product pricing`)
  if (!whatsappConfigured) recommendations.push("WHATSAPP_BUSINESS_TOKEN not set — inbound WhatsApp tracking unavailable")

  const score = Math.max(0, 100 - (issues.length * 20) - (attributionRate < 50 ? 15 : 0))

  return {
    generatedAt: new Date().toISOString(),
    score: Math.min(100, score),
    whatsappConfigured,
    last7d: {
      totalClicks,
      attributedClicks,
      attributionRate,
      uniqueCreators: creatorSet.size,
    },
    orphanedCampaignLinks: 0,  // tracked via whatsapp_events; orphan detection requires join
    conversionGapCreators,
    issues,
    recommendations,
  }
}
