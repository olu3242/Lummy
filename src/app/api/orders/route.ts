import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    .from("orders")
    .select("id, order_number, status, payment_status, total_amount, currency, created_at, notes")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
