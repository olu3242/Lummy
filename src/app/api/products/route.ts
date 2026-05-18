import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createProductSchema } from "@/lib/validations/product"

// GET /api/products — list creator's own products
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("creator_profiles").select("id").eq("user_id", user.id).maybeSingle()
  if (!profile) return NextResponse.json({ error: "Creator not found" }, { status: 404 })
  const creatorId = (profile as { id: string }).id

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/products — create product
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("creator_profiles").select("id").eq("user_id", user.id).maybeSingle()
  if (!profile) return NextResponse.json({ error: "Creator not found" }, { status: 404 })
  const creatorId = (profile as { id: string }).id

  const body = await request.json()
  const parsed = createProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("products")
    .insert({ ...parsed.data, creator_id: creatorId, images: parsed.data.images })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
