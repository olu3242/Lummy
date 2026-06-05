import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function resolveOrganizationId(supabase: ReturnType<typeof createClient>, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.organization_id ?? null
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const organizationId = await resolveOrganizationId(supabase, user.id)
  if (!organizationId) return NextResponse.json({ schema: null })

  const storefront = await supabase
    .from("storefronts")
    .select("store_schema")
    .eq("organization_id", organizationId)
    .maybeSingle()
  if (storefront.error) return NextResponse.json({ error: storefront.error.message }, { status: 500 })

  return NextResponse.json({ schema: storefront.data?.store_schema ?? null })
}

export async function PUT(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.schema) return NextResponse.json({ error: "Missing schema" }, { status: 400 })

  const organizationId = await resolveOrganizationId(supabase, user.id)
  if (!organizationId) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  const result = await supabase
    .from("storefronts")
    .upsert(
      { organization_id: organizationId, store_schema: body.schema, updated_at: new Date().toISOString() },
      { onConflict: "organization_id" },
    )
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
