import { createAdminClient } from "@/lib/supabase/server"
import { dispatchAutomation } from "@/lib/automation/triggers"
import { logger } from "@/lib/observability/logger"

function generateReferralCode(handle: string): string {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${handle.slice(0, 6).toUpperCase()}-${suffix}`
}

export interface ReferralStats {
  code: string
  totalReferred: number
  activated: number
  withFirstSale: number
  pendingReward: number
  totalRewardKobo: number
}

export async function getOrCreateReferralCode(creatorId: string): Promise<string> {
  const supabase = createAdminClient()

  // Check for existing unused code
  const { data: existing } = await supabase
    .from("creator_referrals")
    .select("code")
    .eq("referrer_id", creatorId)
    .is("referred_id", null)
    .limit(1)
    .maybeSingle()

  if (existing) return (existing as { code: string }).code

  // Fetch handle for code prefix
  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("handle")
    .eq("id", creatorId)
    .maybeSingle()

  const handle = (profile as { handle: string } | null)?.handle ?? "LUMMY"
  const code = generateReferralCode(handle)

  await supabase.from("creator_referrals").insert({
    referrer_id: creatorId,
    code,
    status: "pending",
  })

  return code
}

export async function applyReferralCode(code: string, newCreatorId: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("creator_referrals")
    .select("id, referrer_id, referred_id")
    .eq("code", code.toUpperCase())
    .is("referred_id", null)
    .maybeSingle()

  if (!data) return false
  const ref = data as { id: string; referrer_id: string; referred_id: string | null }

  // Self-referral guard
  if (ref.referrer_id === newCreatorId) return false

  const { error } = await supabase
    .from("creator_referrals")
    .update({ referred_id: newCreatorId, referred_at: new Date().toISOString(), status: "pending" })
    .eq("id", ref.id)

  if (error) return false

  logger.info("[referrals] code applied", { code, newCreatorId, referrerId: ref.referrer_id })
  return true
}

export async function activateReferral(referredCreatorId: string): Promise<void> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("creator_referrals")
    .select("id, referrer_id, status")
    .eq("referred_id", referredCreatorId)
    .eq("status", "pending")
    .maybeSingle()

  if (!data) return
  const ref = data as { id: string; referrer_id: string; status: string }

  await supabase.from("creator_referrals").update({
    status: "activated",
    activated_at: new Date().toISOString(),
  }).eq("id", ref.id)

  // Notify referrer
  dispatchAutomation({
    name: "storefront_published",
    creatorId: ref.referrer_id,
    payload: { type: "referral_activated", referredId: referredCreatorId },
    idempotencyKey: `referral_activated:${ref.id}`,
  })
}

export async function recordReferralSale(referredCreatorId: string): Promise<void> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("creator_referrals")
    .select("id, referrer_id, first_sale_at")
    .eq("referred_id", referredCreatorId)
    .in("status", ["pending", "activated"])
    .is("first_sale_at", null)
    .maybeSingle()

  if (!data) return
  const ref = data as { id: string; referrer_id: string; first_sale_at: string | null }

  await supabase.from("creator_referrals").update({
    first_sale_at: new Date().toISOString(),
    status: "rewarded",
    reward_amount_kobo: 50_000_00, // 500 NGN reward (configurable)
  }).eq("id", ref.id)
}

export async function getReferralStats(creatorId: string): Promise<ReferralStats> {
  const supabase = createAdminClient()

  const code = await getOrCreateReferralCode(creatorId)

  const { data } = await supabase
    .from("creator_referrals")
    .select("status, first_sale_at, reward_amount_kobo")
    .eq("referrer_id", creatorId)
    .not("referred_id", "is", null)

  const rows = (data as { status: string; first_sale_at: string | null; reward_amount_kobo: number }[] | null) ?? []

  return {
    code,
    totalReferred: rows.length,
    activated: rows.filter(r => r.status === "activated" || r.status === "rewarded").length,
    withFirstSale: rows.filter(r => r.first_sale_at).length,
    pendingReward: rows.filter(r => r.status === "rewarded" && r.reward_amount_kobo > 0).length,
    totalRewardKobo: rows.reduce((s, r) => s + (r.reward_amount_kobo ?? 0), 0),
  }
}

export async function getTopReferrers(limit = 10): Promise<Array<{ creatorId: string; handle: string; referred: number; activated: number }>> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("creator_referrals")
    .select("referrer_id, status")
    .not("referred_id", "is", null)

  if (!data) return []

  const counts = new Map<string, { referred: number; activated: number }>()
  for (const row of data as { referrer_id: string; status: string }[]) {
    if (!counts.has(row.referrer_id)) counts.set(row.referrer_id, { referred: 0, activated: 0 })
    const c = counts.get(row.referrer_id)!
    c.referred++
    if (row.status === "activated" || row.status === "rewarded") c.activated++
  }

  const topIds = Array.from(counts.entries())
    .sort((a, b) => b[1].referred - a[1].referred)
    .slice(0, limit)

  if (topIds.length === 0) return []

  const { data: profiles } = await supabase
    .from("creator_profiles")
    .select("id, handle")
    .in("id", topIds.map(([id]) => id))

  const handleMap = new Map((profiles as { id: string; handle: string }[] | null ?? []).map(p => [p.id, p.handle]))

  return topIds.map(([creatorId, stats]) => ({
    creatorId,
    handle: handleMap.get(creatorId) ?? "unknown",
    ...stats,
  }))
}
