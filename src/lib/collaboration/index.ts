import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"

export interface CollaborationInvite {
  id: string
  initiatorId: string
  partnerId: string
  collaborationType: "cross_promotion" | "affiliate" | "co_campaign" | "bundle"
  status: "pending" | "active" | "paused" | "ended"
  affiliateCode: string | null
  commissionPct: number
  createdAt: string
}

export interface CollaborationStats {
  totalCollaborations: number
  activeCollaborations: number
  pendingInvites: number
  affiliateRevenue: number
  topPartner: string | null
}

function generateAffiliateCode(handle1: string, handle2: string): string {
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `${handle1.slice(0, 4).toUpperCase()}-${handle2.slice(0, 4).toUpperCase()}-${suffix}`
}

export async function inviteCollaboration(opts: {
  initiatorId: string
  partnerHandle: string
  collaborationType: CollaborationInvite["collaborationType"]
  commissionPct?: number
}): Promise<{ ok: boolean; collaborationId?: string; error?: string }> {
  const supabase = createAdminClient()

  const { data: partner } = await supabase
    .from("creator_profiles")
    .select("id, handle")
    .eq("handle", opts.partnerHandle)
    .eq("is_published", true)
    .maybeSingle()

  if (!partner) return { ok: false, error: "Partner not found" }
  const p = partner as { id: string; handle: string }

  if (p.id === opts.initiatorId) return { ok: false, error: "Cannot collaborate with yourself" }

  const { data: existing } = await supabase
    .from("creator_collaborations")
    .select("id, status")
    .or(`initiator_id.eq.${opts.initiatorId},partner_id.eq.${opts.initiatorId}`)
    .or(`initiator_id.eq.${p.id},partner_id.eq.${p.id}`)
    .eq("collaboration_type", opts.collaborationType)
    .maybeSingle()

  if (existing) {
    const ex = existing as { id: string; status: string }
    if (ex.status === "active" || ex.status === "pending") {
      return { ok: false, error: "Collaboration already exists" }
    }
  }

  const { data: initiatorProfile } = await supabase
    .from("creator_profiles")
    .select("handle")
    .eq("id", opts.initiatorId)
    .maybeSingle()

  const initiatorHandle = (initiatorProfile as { handle: string } | null)?.handle ?? "LMY"
  const affiliateCode = opts.collaborationType === "affiliate"
    ? generateAffiliateCode(initiatorHandle, p.handle)
    : null

  const { data: collab, error } = await supabase
    .from("creator_collaborations")
    .insert({
      initiator_id: opts.initiatorId,
      partner_id: p.id,
      collaboration_type: opts.collaborationType,
      status: "pending",
      affiliate_code: affiliateCode,
      commission_pct: opts.commissionPct ?? 0,
    })
    .select("id")
    .single()

  if (error) {
    logger.error("[collaboration] invite failed", { error: error.message })
    return { ok: false, error: "Failed to create collaboration" }
  }

  return { ok: true, collaborationId: (collab as { id: string }).id }
}

export async function respondToCollaboration(
  collaborationId: string,
  partnerId: string,
  accept: boolean,
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("creator_collaborations")
    .select("id, partner_id, status")
    .eq("id", collaborationId)
    .eq("partner_id", partnerId)
    .eq("status", "pending")
    .maybeSingle()

  if (!data) return false

  const { error } = await supabase
    .from("creator_collaborations")
    .update({
      status: accept ? "active" : "ended",
      updated_at: new Date().toISOString(),
    })
    .eq("id", collaborationId)

  if (error) return false
  logger.info("[collaboration] responded", { collaborationId, partnerId, accept })
  return true
}

export async function getCreatorCollaborations(creatorId: string): Promise<CollaborationInvite[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("creator_collaborations")
    .select("id, initiator_id, partner_id, collaboration_type, status, affiliate_code, commission_pct, created_at")
    .or(`initiator_id.eq.${creatorId},partner_id.eq.${creatorId}`)
    .order("created_at", { ascending: false })

  return (data as {
    id: string; initiator_id: string; partner_id: string
    collaboration_type: CollaborationInvite["collaborationType"]
    status: CollaborationInvite["status"]; affiliate_code: string | null
    commission_pct: number; created_at: string
  }[] | null ?? []).map(r => ({
    id: r.id,
    initiatorId: r.initiator_id,
    partnerId: r.partner_id,
    collaborationType: r.collaboration_type,
    status: r.status,
    affiliateCode: r.affiliate_code,
    commissionPct: r.commission_pct,
    createdAt: r.created_at,
  }))
}

export async function getCollaborationStats(creatorId: string): Promise<CollaborationStats> {
  const collabs = await getCreatorCollaborations(creatorId)

  const activeCollaborations = collabs.filter(c => c.status === "active").length
  const pendingInvites = collabs.filter(c => c.status === "pending" && c.partnerId === creatorId).length

  const supabase = createAdminClient()
  const affiliateCodes = collabs
    .filter(c => c.affiliateCode && c.status === "active")
    .map(c => c.affiliateCode!)

  let affiliateRevenue = 0
  if (affiliateCodes.length > 0) {
    const { data: attrs } = await supabase
      .from("campaign_attributions")
      .select("attributed_revenue_kobo")
      .in("utm_content", affiliateCodes)

    affiliateRevenue = (attrs as { attributed_revenue_kobo: number }[] | null ?? [])
      .reduce((s, r) => s + (r.attributed_revenue_kobo ?? 0), 0)
  }

  const partnerCounts = new Map<string, number>()
  for (const c of collabs.filter(c => c.status === "active")) {
    const partner = c.initiatorId === creatorId ? c.partnerId : c.initiatorId
    partnerCounts.set(partner, (partnerCounts.get(partner) ?? 0) + 1)
  }
  const topPartnerId = Array.from(partnerCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  let topPartner: string | null = null
  if (topPartnerId) {
    const { data: p } = await supabase
      .from("creator_profiles")
      .select("handle")
      .eq("id", topPartnerId)
      .maybeSingle()
    topPartner = (p as { handle: string } | null)?.handle ?? null
  }

  return {
    totalCollaborations: collabs.length,
    activeCollaborations,
    pendingInvites,
    affiliateRevenue,
    topPartner,
  }
}

export async function trackAffiliateClick(affiliateCode: string, creatorId: string, source: string): Promise<void> {
  const supabase = createAdminClient()
  void Promise.resolve(
    supabase.from("campaign_attributions").insert({
      creator_id: creatorId,
      source,
      medium: "affiliate",
      utm_content: affiliateCode,
    })
  ).catch(() => {})
}

export async function getPlatformCollaborationSummary(): Promise<{
  totalActive: number
  byType: Record<string, number>
  recentActivity: number
}> {
  const supabase = createAdminClient()
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const { data } = await supabase
    .from("creator_collaborations")
    .select("status, collaboration_type, created_at")

  const rows = (data as { status: string; collaboration_type: string; created_at: string }[] | null) ?? []
  const active = rows.filter(r => r.status === "active")

  const byType: Record<string, number> = {}
  for (const r of active) {
    byType[r.collaboration_type] = (byType[r.collaboration_type] ?? 0) + 1
  }

  const recentActivity = rows.filter(r => r.created_at >= since7d).length

  return { totalActive: active.length, byType, recentActivity }
}
