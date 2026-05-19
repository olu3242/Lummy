import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { loadCreatorStoreSchema, saveCreatorStoreSchema } from "@/lib/queries/storefront"

async function resolveCreatorId(supabase: ReturnType<typeof createClient>, userId: string): Promise<string | null> {
  const { data } = await supabase.from("creator_profiles").select("id").eq("user_id", userId).single()
  return data?.id ?? null
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const creatorId = await resolveCreatorId(supabase, user.id)
  if (!creatorId) return NextResponse.json({ schema: null })

  const schema = await loadCreatorStoreSchema(creatorId)
  return NextResponse.json({ schema })
}

export async function PUT(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.schema) return NextResponse.json({ error: "Missing schema" }, { status: 400 })

  const creatorId = await resolveCreatorId(supabase, user.id)
  if (!creatorId) return NextResponse.json({ error: "Creator profile not found" }, { status: 404 })

  const result = await saveCreatorStoreSchema(creatorId, body.schema)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })

  return NextResponse.json({ ok: true })
}
