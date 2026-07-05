import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { updateProduct, archiveProduct, deleteProduct } from "@/services/product-service"

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

// PATCH /api/products/:id — delegates to the canonical Product Service
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json() as Record<string, unknown>
    // Backwards compat with the old field name
    if ('name' in body && !('title' in body)) { body.title = body.name; delete body.name }
    const data = await updateProduct(params.id, body)
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed"
    const status = message === "Unauthorized" ? 401 : message === "Product not found" ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE /api/products/:id — archives by default; ?hard=true deletes permanently
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const hard = new URL(request.url).searchParams.get("hard") === "true"
    if (hard) await deleteProduct(params.id)
    else await archiveProduct(params.id)
    return NextResponse.json({ ok: true, hard })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed"
    const status = message === "Unauthorized" ? 401 : message === "Product not found" ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
