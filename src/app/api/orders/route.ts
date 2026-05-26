import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function getOrganizationId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).maybeSingle()
  return (data as { organization_id: string } | null)?.organization_id ?? null
}

export async function GET() {
  const supabase = createClient()
  const organizationId = await getOrganizationId(supabase)
  if (!organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, payment_status, amount, currency, created_at, notes, customer_name, customer_phone, customer_email, payment_provider")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Normalize to expected shape — map amount → total_amount, generate order_number fallback
  const normalized = (data ?? []).map(o => ({
    ...o,
    total_amount: o.amount,
    order_number: `LMY-${o.id.slice(0, 8).toUpperCase()}`,
    source: o.payment_provider ?? "direct",
  }))

  return NextResponse.json({ data: normalized })
}
