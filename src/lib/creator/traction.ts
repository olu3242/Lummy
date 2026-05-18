import { createAdminClient } from "@/lib/supabase/server"

export interface InviteCodeResult {
  valid: boolean
  code?: string
  error?: string
}

export async function validateInviteCode(code: string): Promise<InviteCodeResult> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("beta_invites")
    .select("id, code, max_uses, use_count, expires_at")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle()

  if (error || !data) return { valid: false, error: "Invalid invite code" }

  const invite = data as {
    id: string; code: string; max_uses: number; use_count: number; expires_at: string | null
  }

  if (invite.use_count >= invite.max_uses) return { valid: false, error: "Invite code already used" }
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { valid: false, error: "Invite code expired" }
  }

  return { valid: true, code: invite.code }
}

export async function redeemInviteCode(code: string, userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("beta_invites")
    .select("id, use_count, max_uses")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle()

  if (!data) return false
  const invite = data as { id: string; use_count: number; max_uses: number }
  if (invite.use_count >= invite.max_uses) return false

  const { error } = await supabase
    .from("beta_invites")
    .update({
      use_count: invite.use_count + 1,
      used_by: userId,
      used_at: new Date().toISOString(),
    })
    .eq("id", invite.id)

  return !error
}

function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export async function createInviteCode(opts: {
  code?: string
  email?: string
  maxUses?: number
  createdBy?: string
  expiresInDays?: number
}): Promise<string> {
  const supabase = createAdminClient()
  const code = (opts.code ?? generateCode()).toUpperCase()
  const expiresAt = opts.expiresInDays
    ? new Date(Date.now() + opts.expiresInDays * 86_400_000).toISOString()
    : null

  await supabase.from("beta_invites").insert({
    code,
    email: opts.email ?? null,
    created_by: opts.createdBy ?? null,
    max_uses: opts.maxUses ?? 1,
    expires_at: expiresAt,
  })

  return code
}

export async function tagCreatorCohort(creatorId: string, tag: string, source = "system"): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from("creator_cohort_tags").upsert(
    { creator_id: creatorId, tag, source },
    { onConflict: "creator_id,tag" }
  )
}

export async function getCreatorCohortTags(creatorId: string): Promise<string[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("creator_cohort_tags")
    .select("tag")
    .eq("creator_id", creatorId)
  return (data as { tag: string }[] | null)?.map(r => r.tag) ?? []
}

export interface CreatorActivationMetrics {
  creatorId: string
  daysToFirstProduct: number | null
  daysToPublish: number | null
  daysToFirstSale: number | null
  cohortTags: string[]
  isActivated: boolean
}

export async function getCreatorActivationMetrics(creatorId: string): Promise<CreatorActivationMetrics> {
  const [profileRes, tagsRes] = await Promise.allSettled([
    createAdminClient()
      .from("creator_profiles")
      .select("created_at, first_product_added_at, storefront_published_at, first_sale_at")
      .eq("id", creatorId)
      .maybeSingle(),
    getCreatorCohortTags(creatorId),
  ])

  const profile = profileRes.status === "fulfilled"
    ? (profileRes.value.data as {
        created_at: string
        first_product_added_at: string | null
        storefront_published_at: string | null
        first_sale_at: string | null
      } | null)
    : null

  const cohortTags = tagsRes.status === "fulfilled" ? tagsRes.value : []

  const daysBetween = (from: string, to: string | null): number | null => {
    if (!to) return null
    return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000)
  }

  const created = profile?.created_at ?? new Date().toISOString()

  return {
    creatorId,
    daysToFirstProduct: daysBetween(created, profile?.first_product_added_at ?? null),
    daysToPublish: daysBetween(created, profile?.storefront_published_at ?? null),
    daysToFirstSale: daysBetween(created, profile?.first_sale_at ?? null),
    cohortTags,
    isActivated: !!profile?.first_sale_at,
  }
}
