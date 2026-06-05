import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { buildWhatsAppLink } from "@/lib/whatsapp/share"

export const dynamic = "force-dynamic"

const schema = z.object({
  eventId:   z.string().uuid(),
  productId: z.string().uuid(),
})

// POST /api/whatsapp/inbox/send-link
// Generates a storefront product deep-link and a pre-filled wa.me URL so the
// creator can send the payment link to the customer via their WhatsApp app.
// Also stamps the whatsapp_events metadata so the inbox can show "link sent".
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  const { eventId, productId } = parsed.data
  const admin = createAdminClient()

  // Resolve creator — need handle for the storefront deep-link
  const { data: creator } = await admin
    .from("creator_profiles")
    .select("id, handle")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!creator) return NextResponse.json({ error: "Creator profile not found" }, { status: 404 })

  // Multi-tenant safety: verify this event belongs to this creator
  const { data: event } = await admin
    .from("whatsapp_events")
    .select("id, creator_id, metadata")
    .eq("id", eventId)
    .eq("creator_id", creator.id)
    .maybeSingle()
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })

  const meta = (event.metadata ?? {}) as Record<string, unknown>
  const senderPhone = meta.from as string | null
  if (!senderPhone) return NextResponse.json({ error: "No sender phone on this conversation" }, { status: 400 })

  // Resolve storefront org to validate product ownership
  const { data: storefront } = await admin
    .from("storefronts")
    .select("organization_id")
    .eq("handle", creator.handle)
    .maybeSingle()
  if (!storefront) return NextResponse.json({ error: "Storefront not configured" }, { status: 400 })

  // Fetch product — must be active and belong to this creator's org
  const { data: product } = await admin
    .from("products")
    .select("id, title, price, currency")
    .eq("id", productId)
    .eq("organization_id", storefront.organization_id)
    .eq("status", "active")
    .maybeSingle()
  if (!product) return NextResponse.json({ error: "Product not found or inactive" }, { status: 404 })

  const row = product as { id: string; title: string; price: number; currency: string }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lummy.co"
  const productUrl = `${appUrl}/${creator.handle}?product=${productId}`

  // Format price for display (prices stored in smallest currency unit)
  const displayPrice = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: row.currency || "USD",
    maximumFractionDigits: 0,
  }).format(Number(row.price) / 100)

  const waMessage = `Hi! 👋 Here's your order link for *${row.title}* (${displayPrice}):\n\n${productUrl}\n\nTap to complete your order 🛍`
  const waLink = buildWhatsAppLink(senderPhone, waMessage)

  // Stamp the event metadata so the inbox shows "link sent" status
  await admin
    .from("whatsapp_events")
    .update({
      metadata: {
        ...meta,
        link_sent_at: new Date().toISOString(),
        link_product_id: productId,
        link_product_title: row.title,
        link_product_url: productUrl,
      },
    })
    .eq("id", eventId)
    .eq("creator_id", creator.id)  // double-check tenant safety on write

  return NextResponse.json({
    waLink,
    productName: row.title,
    productPrice: Number(row.price),
    productUrl,
  })
}
