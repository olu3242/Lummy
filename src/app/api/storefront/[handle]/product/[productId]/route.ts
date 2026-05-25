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
    .select("organization_id, is_active, name, bio")
    .eq("handle", handle)
    .maybeSingle()

  if (!storefront?.is_active) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 })
  }

  // Fetch the specific product, scoped to this organization
  const { data: product, error } = await supabase
    .from("products")
    .select("id, name, price, currency, image_url, creator_id, status, stock_quantity, is_unlimited_stock")
    .eq("id", productId)
    .eq("organization_id", storefront.organization_id)
    .eq("status", "active")
    .maybeSingle()

  if (error || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  // Fetch creator's WhatsApp for the WhatsApp checkout path
  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("whatsapp_number")
    .eq("id", (product as { creator_id: string }).creator_id)
    .maybeSingle()

  type ProductRow = { id: string; name: string; price: number; currency: string; image_url: string | null; creator_id: string; stock_quantity: number | null; is_unlimited_stock: boolean }
  type CreatorRow = { whatsapp_number: string | null } | null

  const p = product as ProductRow
  const c = creator as CreatorRow

  return NextResponse.json({
    data: {
      id:              p.id,
      name:            p.name,
      price:           Number(p.price),
      currency:        p.currency ?? "NGN",
      image_url:       p.image_url ?? null,
      creator_id:      p.creator_id,
      creator_whatsapp: c?.whatsapp_number ?? null,
      store_name:      (storefront as { name?: string }).name ?? handle,
      in_stock:        p.is_unlimited_stock || (p.stock_quantity != null && p.stock_quantity > 0),
    },
  })
}
