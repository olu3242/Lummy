import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const requestSchema = z.object({
  amount:        z.number().positive(),
  currency_code: z.string().length(3).optional().default("NGN"),
})

const MIN_PAYOUT = 500 // minimum 500 in currency (e.g. NGN 500)

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

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }

  const { amount, currency_code } = parsed.data

  if (amount < MIN_PAYOUT) {
    return NextResponse.json(
      { error: `Minimum withdrawal is ${MIN_PAYOUT} ${currency_code}` },
      { status: 400 }
    )
  }

  // Verify payout account exists
  const { data: account } = await supabase
    .from("payout_accounts")
    .select("id")
    .eq("org_id", orgId)
    .maybeSingle()

  if (!account) {
    return NextResponse.json(
      { error: "No payout account linked. Add a bank account in Settings → Payments first." },
      { status: 400 }
    )
  }

  // Calculate available balance: total paid - total completed payouts
  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("organization_id", orgId)
    .eq("status", "succeeded")

  const { data: completedPayouts } = await supabase
    .from("payouts")
    .select("amount")
    .eq("org_id", orgId)
    .in("status", ["approved", "paid"])

  const totalRevenue = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0)
  const totalPaidOut = (completedPayouts ?? []).reduce((s, p) => s + Number(p.amount), 0)
  const available = totalRevenue - totalPaidOut

  if (amount > available) {
    return NextResponse.json(
      { error: `Requested amount exceeds available balance of ${available.toFixed(2)} ${currency_code}` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("payouts")
    .insert({
      org_id: orgId,
      payout_account_id: account.id,
      amount,
      currency_code,
      status: "pending",
      requested_at: new Date().toISOString(),
    })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
