import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { updateProductSchema } from "@/lib/validations/product"
import { sendProductPublishedEmail } from "@/lib/notifications/email"
import { logger } from "@/lib/observability/logger"

type Params = { params: { id: string } }

async function getOrganizationId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).maybeSingle()
  return (data as { organization_id: string } | null)?.organization_id ?? null
}

// GET /api/products/:id
export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = createClient()
  const organizationId = await getOrganizationId(supabase)
  if (!organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("products").select("*").eq("id", params.id).eq("organization_id", organizationId).maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data })
}

// PATCH /api/products/:id
export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = createClient()
  const organizationId = await getOrganizationId(supabase)
  if (!organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = updateProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }

  // Map title if name was sent (backwards compat with old field name)
  const patch = { ...parsed.data } as Record<string, unknown>
  if ('name' in patch && !('title' in patch)) { patch.title = patch.name; delete patch.name }

  const { data, error } = await supabase
    .from("products")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("organization_id", organizationId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Fire-and-forget: product-published email when status transitions to active
  if (patch.status === "active") {
    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.email) return
        const { data: storefront } = await supabase
          .from("storefronts").select("handle").eq("organization_id", organizationId).maybeSingle()
        const productRow = data as { title?: string; price?: number }
        const priceNaira = `₦${Math.round((productRow.price ?? 0) / 100).toLocaleString()}`
        void sendProductPublishedEmail({
          to: user.email,
          creatorName: user.email.split("@")[0]!,
          productName: productRow.title ?? "Product",
          price: priceNaira,
          storeHandle: (storefront as { handle?: string } | null)?.handle ?? "",
        })
      } catch (e) {
        logger.warn("product-published email failed", { productId: params.id, error: String(e) })
      }
    })()
  }

  return NextResponse.json({ data })
}

// DELETE /api/products/:id — soft delete via status=draft
export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = createClient()
  const organizationId = await getOrganizationId(supabase)
  if (!organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase
    .from("products")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("organization_id", organizationId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
