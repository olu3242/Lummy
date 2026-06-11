import { createAdminClient } from "@/lib/supabase/server"

export interface CommunicationScore {
  score: number             // 0-100
  grade: "A" | "B" | "C" | "D" | "F"
  followUpRate: number      // % conversations marked followed_up
  responseReadRate: number  // % conversations marked read
  last7dVolume: number
  repeatSenderRate: number  // % senders who messaged >1 time
  trend: "rising" | "stable" | "falling"
}

export interface ConversationOutcomes {
  totalConversations: number
  followedUp: number
  stale: number             // read but not followed up >48h
  avgDaysToFollowUp: number | null
  conversationsWithCampaign: number
  attributionRate: number   // % with campaign_id
}

export async function getCreatorCommunicationScore(creatorId: string): Promise<CommunicationScore> {
  const supabase = createAdminClient()
  const since7d  = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const since14d = new Date(Date.now() - 14 * 86_400_000).toISOString()

  const [totalRes, followedRes, readRes, last7dRes, last14dRes, allMetaRes] = await Promise.allSettled([
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("creator_id", creatorId).eq("event_type", "conversation"),
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("creator_id", creatorId).eq("event_type", "conversation").eq("is_followed_up", true),
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("creator_id", creatorId).eq("event_type", "conversation").eq("is_read", true),
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("creator_id", creatorId).eq("event_type", "conversation").gte("created_at", since7d),
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("creator_id", creatorId).eq("event_type", "conversation").gte("created_at", since14d).lt("created_at", since7d),
    supabase.from("whatsapp_events").select("metadata").eq("creator_id", creatorId).eq("event_type", "conversation").limit(200),
  ])

  const total   = totalRes.status === "fulfilled" ? (totalRes.value.count ?? 0) : 0
  const followed = followedRes.status === "fulfilled" ? (followedRes.value.count ?? 0) : 0
  const read    = readRes.status === "fulfilled" ? (readRes.value.count ?? 0) : 0
  const last7d  = last7dRes.status === "fulfilled" ? (last7dRes.value.count ?? 0) : 0
  const prev7d  = last14dRes.status === "fulfilled" ? (last14dRes.value.count ?? 0) : 0

  const followUpRate     = total > 0 ? Math.round(followed / total * 100) : 0
  const responseReadRate = total > 0 ? Math.round(read / total * 100) : 0

  // Repeat sender rate
  const metas = allMetaRes.status === "fulfilled"
    ? (allMetaRes.value.data ?? []).map((r: Record<string, unknown>) => (r.metadata as Record<string, unknown>) ?? {})
    : []
  const phones = metas.map(m => m.from as string | null).filter(Boolean) as string[]
  const uniquePhones = new Set(phones)
  const repeatPhones = phones.length - uniquePhones.size
  const repeatSenderRate = uniquePhones.size > 0 ? Math.round(repeatPhones / uniquePhones.size * 100) : 0

  const trend: CommunicationScore["trend"] = last7d > prev7d * 1.1 ? "rising" : last7d < prev7d * 0.9 ? "falling" : "stable"

  const score = Math.round(
    (followUpRate * 0.4) +
    (responseReadRate * 0.3) +
    (Math.min(last7d, 20) / 20 * 100 * 0.2) +
    (Math.min(repeatSenderRate, 30) / 30 * 100 * 0.1)
  )

  const grade: CommunicationScore["grade"] = score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : score >= 30 ? "D" : "F"

  return {
    score: Math.min(100, score),
    grade,
    followUpRate,
    responseReadRate,
    last7dVolume: last7d,
    repeatSenderRate,
    trend,
  }
}

export async function getConversationOutcomes(creatorId: string): Promise<ConversationOutcomes> {
  const supabase = createAdminClient()
  const staleThreshold = new Date(Date.now() - 48 * 3_600_000).toISOString()

  const [totalRes, followedRes, staleRes, campaignRes, followUpTimesRes] = await Promise.allSettled([
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("creator_id", creatorId).eq("event_type", "conversation"),
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("creator_id", creatorId).eq("event_type", "conversation").eq("is_followed_up", true),
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("creator_id", creatorId).eq("event_type", "conversation").eq("is_read", true).eq("is_followed_up", false).lte("created_at", staleThreshold),
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("creator_id", creatorId).eq("event_type", "conversation").not("campaign_id", "is", null),
    supabase.from("whatsapp_events").select("created_at, followed_up_at").eq("creator_id", creatorId).eq("event_type", "conversation").eq("is_followed_up", true).not("followed_up_at", "is", null).limit(50),
  ])

  const total   = totalRes.status === "fulfilled" ? (totalRes.value.count ?? 0) : 0
  const followed = followedRes.status === "fulfilled" ? (followedRes.value.count ?? 0) : 0
  const stale   = staleRes.status === "fulfilled" ? (staleRes.value.count ?? 0) : 0
  const withCampaign = campaignRes.status === "fulfilled" ? (campaignRes.value.count ?? 0) : 0

  // Average days to follow up
  let avgDaysToFollowUp: number | null = null
  if (followUpTimesRes.status === "fulfilled" && (followUpTimesRes.value.data ?? []).length > 0) {
    const rows = (followUpTimesRes.value.data ?? []) as Array<{ created_at: string; followed_up_at: string | null }>
    const deltas = rows
      .filter(r => r.followed_up_at)
      .map(r => (new Date(r.followed_up_at!).getTime() - new Date(r.created_at).getTime()) / 86_400_000)
    avgDaysToFollowUp = deltas.length > 0 ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length * 10) / 10 : null
  }

  return {
    totalConversations: total,
    followedUp: followed,
    stale,
    avgDaysToFollowUp,
    conversationsWithCampaign: withCampaign,
    attributionRate: total > 0 ? Math.round(withCampaign / total * 100) : 0,
  }
}

export interface PlatformCommsSummary {
  totalCreatorsWithConversations: number
  platformConversations7d: number
  avgFollowUpRate: number
  unassignedConversations: number  // conversation events with no creator_id matched
  staleConversations: number
}

export async function getPlatformCommsSummary(): Promise<PlatformCommsSummary> {
  const supabase = createAdminClient()
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const staleThreshold = new Date(Date.now() - 48 * 3_600_000).toISOString()

  const [creatorsRes, last7dRes, staleRes] = await Promise.allSettled([
    supabase.from("whatsapp_events").select("creator_id").eq("event_type", "conversation"),
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("event_type", "conversation").gte("created_at", since7d),
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("event_type", "conversation").eq("is_read", true).eq("is_followed_up", false).lte("created_at", staleThreshold),
  ])

  const allCreators = creatorsRes.status === "fulfilled"
    ? new Set((creatorsRes.value.data ?? []).map((r: Record<string, unknown>) => r.creator_id as string))
    : new Set()

  return {
    totalCreatorsWithConversations: allCreators.size,
    platformConversations7d: last7dRes.status === "fulfilled" ? (last7dRes.value.count ?? 0) : 0,
    avgFollowUpRate: 0,   // Would require per-creator aggregation — deferred
    unassignedConversations: 0,
    staleConversations: staleRes.status === "fulfilled" ? (staleRes.value.count ?? 0) : 0,
  }
}
