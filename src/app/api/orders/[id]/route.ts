import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

type Params = { params: { id: string } }

const validStatuses = ["pending","confirmed","processing","shipped","delivered","cancelled","refunded"] as const
const updateSchema = z.object({
  status: z.enum(validStatuses).optional(),
  notes:  z.string().max(1000).optional(),
})

async function getCreatorId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("creator_profiles").select("id").eq("user_id", user.id).maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = createClient()
  const creatorId = await getCreatorId(supabase)
  if (!creatorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("orders").select("*").eq("id", params.id).eq("creator_id", creatorId).maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = createClient()
  const creatorId = await getCreatorId(supabase)
  if (!creatorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("creator_id", creatorId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data })
}
