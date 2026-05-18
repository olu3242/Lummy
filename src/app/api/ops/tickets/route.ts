import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getOpenTicketCount, getAllOpenTickets } from "@/lib/support/tickets"

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("creator_profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle()

  const isAdmin = (profile as { is_admin?: boolean } | null)?.is_admin === true
    || user.email?.endsWith("@lummy.co")
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [count, tickets] = await Promise.all([getOpenTicketCount(), getAllOpenTickets()])
  return NextResponse.json({ count, tickets })
}
