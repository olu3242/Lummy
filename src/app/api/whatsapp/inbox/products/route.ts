import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// GET /api/whatsapp/inbox/products
// Returns the authenticated creator's active products for the inbox payment-link picker.
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()

  const { data: creator } = await admin
    .from("creator_profiles")
    .select("handle")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!creator?.handle) {
    return NextResponse.json({ products: [] })
  }

  // Products are scoped to the storefront's organization
  const { data: storefront } = await admin
    .from("storefronts")
    .select("organization_id")
    .eq("handle", creator.handle)
    .maybeSingle()

  if (!storefront) {
    return NextResponse.json({ products: [] })
  }

  const { data: products } = await admin
    .from("products")
    .select("id, title, price, currency, image_url")
    .eq("organization_id", storefront.organization_id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20)

  return NextResponse.json({ products: products ?? [] })
}
