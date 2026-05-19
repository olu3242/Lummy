import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const createLeadSchema = z.object({
  full_name:           z.string().min(1).max(200),
  phone:               z.string().optional(),
  email:               z.string().email().optional(),
  instagram_handle:    z.string().optional(),
  source:              z.string().optional(),
  interested_in:       z.array(z.string()).optional(),
  notes:               z.string().max(2000).optional(),
})

async function getCreatorId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("creator_profiles").select("id").eq("user_id", user.id).maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

export async function GET() {
  const supabase = createClient()
  const creatorId = await getCreatorId(supabase)
  if (!creatorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("leads")
    .select("id, full_name, phone, email, status, source, created_at, follow_up_at")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const creatorId = await getCreatorId(supabase)
  if (!creatorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = createLeadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({ ...parsed.data, creator_id: creatorId, status: "new" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
