import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { publishStorefront, unpublishStorefront, notifyStorefrontPublished } from "@/lib/queries/activation"
import { trackEvent } from "@/lib/observability/events"
import { emitEvent } from "@/lib/automation/sdk"

async function requireUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Validate readiness: must have at least one published product
  const supabase = createClient()
  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("id, handle, whatsapp_number")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const p = profile as { id: string; handle: string | null; whatsapp_number: string | null }

  if (!p.handle) {
    return NextResponse.json({ error: "Store handle is required before publishing" }, { status: 422 })
  }
  if (!p.whatsapp_number) {
    return NextResponse.json({ error: "WhatsApp number is required before publishing" }, { status: 422 })
  }

  const { count: productCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", p.id)
    .eq("is_published", true)

  if ((productCount ?? 0) === 0) {
    return NextResponse.json({ error: "Add at least one product before publishing" }, { status: 422 })
  }

  const result = await publishStorefront(user.id)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })

  trackEvent("storefront.view", { userId: user.id, action: "published", handle: p.handle })

  // Notify creator async
  if (p.handle) {
    void notifyStorefrontPublished(user.id, p.handle).catch(console.error)
  }

  // Emit automation event for STO-01 workflow
  void emitEvent("storefront_published", { tenantId: p.id, creatorId: p.id }, {
    handle: p.handle,
  }, `storefront_published:${p.id}`)

  return NextResponse.json({ ok: true, handle: p.handle })
}

export async function DELETE() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const result = await unpublishStorefront(user.id)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })

  trackEvent("storefront.view", { userId: user.id, action: "unpublished" })
  return NextResponse.json({ ok: true })
}
