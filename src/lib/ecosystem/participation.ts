import { createAdminClient } from "@/lib/supabase/server"

export type EcosystemTier = "inactive" | "participant" | "contributor" | "leader"

export interface EcosystemScore {
  score: number
  tier: EcosystemTier
  hasReferralCode: boolean
  referralCount: number
  activeCollaborations: number
  attributionLinks: number
  weeklyActivity: number
  highlights: string[]
}

export interface PlatformEcosystemHealth {
  participationRate: number
  contributorRate: number
  totalReferralPairs: number
  totalActiveCollaborations: number
  weeklyAttributionLinks: number
  ecosystemGrowthTrend: "growing" | "stable" | "declining"
}

export async function getEcosystemParticipationScore(creatorId: string): Promise<EcosystemScore> {
  const supabase = createAdminClient()
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [referralRes, collabRes, attrRes, eventsRes] = await Promise.allSettled([
    supabase.from("creator_referrals")
      .select("id, referred_id, status")
      .eq("referrer_id", creatorId),
    supabase.from("creator_collaborations")
      .select("id, status")
      .or(`initiator_id.eq.${creatorId},partner_id.eq.${creatorId}`)
      .eq("status", "active"),
    supabase.from("campaign_attributions")
      .select("id")
      .eq("creator_id", creatorId)
      .gte("clicked_at", since30d),
    supabase.from("ecosystem_participation_events")
      .select("activity_type")
      .eq("creator_id", creatorId)
      .gte("created_at", since7d),
  ])

  const referrals = referralRes.status === "fulfilled"
    ? (referralRes.value.data as { id: string; referred_id: string | null; status: string }[] | null) ?? []
    : []
  const collabs = collabRes.status === "fulfilled"
    ? (collabRes.value.data as { id: string; status: string }[] | null) ?? []
    : []
  const attrs = attrRes.status === "fulfilled"
    ? (attrRes.value.data as { id: string }[] | null) ?? []
    : []
  const events = eventsRes.status === "fulfilled"
    ? (eventsRes.value.data as { activity_type: string }[] | null) ?? []
    : []

  const hasReferralCode = referrals.length > 0
  const referralCount = referrals.filter(r => r.referred_id).length
  const activeCollaborations = collabs.length
  const attributionLinks = attrs.length
  const weeklyActivity = events.length

  let score = 0
  if (hasReferralCode)           score += 10
  if (referralCount >= 1)        score += 20
  if (referralCount >= 3)        score += 15
  if (activeCollaborations >= 1) score += 20
  if (activeCollaborations >= 3) score += 15
  if (attributionLinks >= 5)     score += 10
  if (attributionLinks >= 20)    score += 10

  const tier: EcosystemTier =
    score >= 70 ? "leader" :
    score >= 40 ? "contributor" :
    score >= 10 ? "participant" : "inactive"

  const highlights: string[] = []
  if (referralCount > 0) highlights.push(`Referred ${referralCount} creator${referralCount > 1 ? "s" : ""}`)
  if (activeCollaborations > 0) highlights.push(`${activeCollaborations} active collaboration${activeCollaborations > 1 ? "s" : ""}`)
  if (attributionLinks > 0) highlights.push(`${attributionLinks} campaign links tracked`)

  return {
    score, tier, hasReferralCode, referralCount,
    activeCollaborations, attributionLinks, weeklyActivity, highlights,
  }
}

export async function logEcosystemActivity(creatorId: string, activityType: string, metadata: Record<string, unknown> = {}): Promise<void> {
  const supabase = createAdminClient()
  void Promise.resolve(
    supabase.from("ecosystem_participation_events").insert({
      creator_id: creatorId,
      activity_type: activityType,
      metadata,
    })
  ).catch(() => {})
}

export async function getPlatformEcosystemHealth(): Promise<PlatformEcosystemHealth> {
  const supabase = createAdminClient()
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const since14d = new Date(Date.now() - 14 * 86_400_000).toISOString()

  const [profilesRes, referralsRes, collabsRes, attrsRes, attrsOldRes] = await Promise.allSettled([
    supabase.from("creator_profiles").select("id", { count: "exact", head: true }),
    supabase.from("creator_referrals").select("referrer_id, referred_id").not("referred_id", "is", null),
    supabase.from("creator_collaborations").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("campaign_attributions").select("id", { count: "exact", head: true }).gte("clicked_at", since7d),
    supabase.from("campaign_attributions").select("id", { count: "exact", head: true })
      .gte("clicked_at", since14d).lt("clicked_at", since7d),
  ])

  const totalCreators = profilesRes.status === "fulfilled" ? (profilesRes.value.count ?? 0) : 0
  const referrals = referralsRes.status === "fulfilled"
    ? (referralsRes.value.data as { referrer_id: string; referred_id: string }[] | null) ?? []
    : []
  const totalActiveCollaborations = collabsRes.status === "fulfilled" ? (collabsRes.value.count ?? 0) : 0
  const weeklyAttributionLinks = attrsRes.status === "fulfilled" ? (attrsRes.value.count ?? 0) : 0
  const priorWeekLinks = attrsOldRes.status === "fulfilled" ? (attrsOldRes.value.count ?? 0) : 0

  const uniqueReferrers = new Set(referrals.map(r => r.referrer_id)).size
  const participationRate = totalCreators > 0 ? Math.round(uniqueReferrers / totalCreators * 100) : 0
  const contributorRate = totalCreators > 0 ? Math.round(totalActiveCollaborations / totalCreators * 100) : 0
  const totalReferralPairs = referrals.length

  const ecosystemGrowthTrend: PlatformEcosystemHealth["ecosystemGrowthTrend"] =
    weeklyAttributionLinks > priorWeekLinks * 1.1 ? "growing" :
    weeklyAttributionLinks < priorWeekLinks * 0.9 ? "declining" : "stable"

  return {
    participationRate, contributorRate, totalReferralPairs,
    totalActiveCollaborations, weeklyAttributionLinks, ecosystemGrowthTrend,
  }
}
