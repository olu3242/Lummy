import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { errorResponse, getCorrelationId, logApiEvent } from "@/lib/ops-observability"

const RESERVED_STOREFRONT_HANDLES = new Set(["admin", "api", "app", "dashboard", "login", "signup", "onboarding", "www"])
const normalizeHandle = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9._-]/g, "")

function fallbackHandle(input: { storefrontHandle?: string | null; organizationName?: string | null; email?: string | null; userId: string }) {
  const fromExisting = normalizeHandle(input.storefrontHandle ?? "")
  if (fromExisting && !RESERVED_STOREFRONT_HANDLES.has(fromExisting)) return fromExisting

  const fromOrg = normalizeHandle(input.organizationName ?? "")
  if (fromOrg && !RESERVED_STOREFRONT_HANDLES.has(fromOrg)) return fromOrg

  const emailName = input.email?.split("@")[0]
  const fromEmail = normalizeHandle(emailName ?? "")
  if (fromEmail && !RESERVED_STOREFRONT_HANDLES.has(fromEmail)) return fromEmail

  return `creator-${input.userId.slice(0, 8)}`
}

async function availableHandle(supabase: ReturnType<typeof createClient>, organizationId: string, handle: string, userId: string) {
  const clean = normalizeHandle(handle)
  const clash = await supabase.from("storefronts").select("organization_id").eq("handle", clean).neq("organization_id", organizationId).limit(1)
  if (clash.error) throw clash.error
  if ((clash.data?.length ?? 0) === 0) return clean
  return `${clean}-${userId.slice(0, 6)}`
}

async function getCurrentContext(supabase: ReturnType<typeof createClient>, userId: string) {
  const [profile, membership] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  if (profile.error) throw profile.error
  if (membership.error) throw membership.error

  const organizationId = membership.data?.organization_id ?? null
  const [organization, storefront] = organizationId
    ? await Promise.all([
        supabase.from("organizations").select("*").eq("id", organizationId).maybeSingle(),
        supabase.from("storefronts").select("*").eq("organization_id", organizationId).maybeSingle(),
      ])
    : [{ data: null, error: null }, { data: null, error: null }]

  if (organization.error) throw organization.error
  if (storefront.error) throw storefront.error

  return {
    profile: profile.data,
    membership: membership.data,
    organization: organization.data,
    storefront: storefront.data,
  }
}

export async function GET(req: Request) {
  const correlationId = getCorrelationId(req)
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()

  if (!auth.user) return errorResponse(401, "UNAUTHORIZED", "Unauthorized", correlationId)

  try {
    const context = await getCurrentContext(supabase, auth.user.id)
    return NextResponse.json({ ...context, user: { id: auth.user.id, email: auth.user.email }, correlationId }, { headers: { "x-correlation-id": correlationId } })
  } catch (error) {
    logApiEvent("error", "account.config_fetch_failed", { correlationId, message: error instanceof Error ? error.message : "Config fetch failed" })
    return errorResponse(400, "CONFIG_FETCH_FAILED", "Config fetch failed", correlationId)
  }
}

export async function PATCH(req: Request) {
  const correlationId = getCorrelationId(req)
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()

  if (!auth.user) return errorResponse(401, "UNAUTHORIZED", "Unauthorized", correlationId)

  try {
    const body = await req.json()
    const context = await getCurrentContext(supabase, auth.user.id)
    const organizationId = context.membership?.organization_id ?? null

    if (body.profile) {
      const profilePatch: Record<string, unknown> = {}
      if (body.profile.full_name !== undefined) profilePatch.full_name = body.profile.full_name
      if (body.profile.phone !== undefined) profilePatch.phone = body.profile.phone
      if (body.profile.avatar_url !== undefined) profilePatch.avatar_url = body.profile.avatar_url
      if (body.profile.location !== undefined) profilePatch.location = body.profile.location

      if (Object.keys(profilePatch).length > 0) {
        profilePatch.updated_at = new Date().toISOString()
        const profileUpdate = await supabase.from("profiles").update(profilePatch).eq("id", auth.user.id)
        if (profileUpdate.error) throw profileUpdate.error
      }
    }

    if (body.organization || body.storefront) {
      if (!organizationId) throw new Error("No organization context")

      if (body.organization?.name !== undefined) {
        const orgUpdate = await supabase.from("organizations").update({ name: body.organization.name }).eq("id", organizationId)
        if (orgUpdate.error) throw orgUpdate.error
      }

      const storefrontPatch: Record<string, unknown> = {}
      if (body.storefront?.handle !== undefined) {
        const cleanHandle = normalizeHandle(body.storefront.handle)
        if (!cleanHandle || RESERVED_STOREFRONT_HANDLES.has(cleanHandle)) throw new Error("Reserved storefront handle")
        const clash = await supabase.from("storefronts").select("organization_id").eq("handle", cleanHandle).neq("organization_id", organizationId).limit(1)
        if (clash.error) throw clash.error
        if ((clash.data?.length ?? 0) > 0) throw new Error("Storefront handle already taken")
        storefrontPatch.handle = cleanHandle
      }
      if (body.storefront?.bio !== undefined) storefrontPatch.bio = body.storefront.bio
      if (body.storefront?.hero_image !== undefined) storefrontPatch.hero_image = body.storefront.hero_image
      if (body.storefront?.social_links !== undefined) storefrontPatch.social_links = body.storefront.social_links
      if (body.storefront?.is_active !== undefined) storefrontPatch.is_active = body.storefront.is_active
      if (body.storefront?.theme !== undefined) storefrontPatch.theme = body.storefront.theme
      if (body.storefront?.store_schema !== undefined) storefrontPatch.store_schema = body.storefront.store_schema
      if (body.storefront?.currency_code !== undefined) storefrontPatch.currency_code = body.storefront.currency_code
      if (body.storefront?.currency_symbol !== undefined) storefrontPatch.currency_symbol = body.storefront.currency_symbol

      if (Object.keys(storefrontPatch).length > 0) {
        storefrontPatch.handle = await availableHandle(supabase, organizationId, String(storefrontPatch.handle ?? fallbackHandle({
          storefrontHandle: context.storefront?.handle,
          organizationName: body.organization?.name ?? context.organization?.name,
          email: auth.user.email,
          userId: auth.user.id,
        })), auth.user.id)
        storefrontPatch.updated_at = new Date().toISOString()
        const storefrontUpdate = await supabase
          .from("storefronts")
          .upsert({ organization_id: organizationId, ...storefrontPatch }, { onConflict: "organization_id" })
        if (storefrontUpdate.error) throw storefrontUpdate.error
      }
    }

    const updatedContext = await getCurrentContext(supabase, auth.user.id)
    return NextResponse.json({ ...updatedContext, correlationId }, { headers: { "x-correlation-id": correlationId } })
  } catch (error) {
    logApiEvent("error", "account.config_update_failed", { correlationId, message: error instanceof Error ? error.message : "Config update failed" })
    return errorResponse(400, "CONFIG_UPDATE_FAILED", error instanceof Error ? error.message : "Config update failed", correlationId)
  }
}
