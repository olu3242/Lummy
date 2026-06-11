import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const upsertSchema = z.object({
  bank_name:      z.string().min(1).max(100),
  account_name:   z.string().min(1).max(200),
  account_number: z.string().min(6).max(20),
  currency_code:  z.string().length(3).optional().default("NGN"),
})

async function getOrgId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  return data?.organization_id ?? null
}

export async function GET() {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("payout_accounts")
    .select("*")
    .eq("org_id", orgId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("payout_accounts")
    .insert({ org_id: orgId, ...parsed.data })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = upsertSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("payout_accounts")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "No payout account found" }, { status: 404 })
  return NextResponse.json({ data })
}
