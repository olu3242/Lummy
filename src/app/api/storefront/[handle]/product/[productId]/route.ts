/**
 * Public product lookup for checkout — does NOT require auth.
 * Scoped to a specific storefront handle to prevent enumeration.
 * GET /api/storefront/[handle]/product/[productId]
 */

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

type Params = { params: { handle: string; productId: string } }

export async function GET(_req: Request, { params }: Params) {
  const { handle, productId } = params

  const supabase = createAdminClient()

  // Resolve organization from storefront handle
  const { data: storefront } = await supabase
    .from("storefronts")
    .select("organization_id, is_active, bio")
    .eq("handle", handle)
    .maybeSingle()

  if (!storefront?.is_active) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 })
  }

  // Fetch the specific product, scoped to this organization (migration-040 schema: title not name)
  const { data: product, error } = await supabase
    .from("products")
    .select("id, title, price, currency, image_url, status")
    .eq("id", productId)
    .eq("organization_id", storefront.organization_id)
    .eq("status", "active")
    .maybeSingle()

  if (error || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  // Resolve organization name + creator WhatsApp via organizations.owner_id → creator_profiles
  const { data: org } = await supabase
    .from("organizations")
    .select("name, owner_id")
    .eq("id", storefront.organization_id)
    .maybeSingle()

  let creatorWhatsapp: string | null = null
  let creatorId: string | null = null
  if (org?.owner_id) {
    const { data: cp } = await supabase
      .from("creator_profiles")
      .select("id, whatsapp_number")
      .eq("user_id", org.owner_id)
      .maybeSingle()
    creatorWhatsapp = (cp as { id: string; whatsapp_number: string | null } | null)?.whatsapp_number ?? null
    creatorId = (cp as { id: string; whatsapp_number: string | null } | null)?.id ?? null
  }

  type ProductRow = { id: string; title: string; price: number; currency: string; image_url: string | null }
  const p = product as ProductRow

  return NextResponse.json({
    data: {
      id:               p.id,
      name:             p.title,
      price:            Number(p.price),
      currency:         p.currency ?? "NGN",
      image_url:        p.image_url ?? null,
      creator_id:       creatorId,
      creator_whatsapp: creatorWhatsapp,
      store_name:       (org as { name?: string } | null)?.name ?? handle,
      in_stock:         true, // migration-040 products have no stock tracking; always available
    },
  })
}
