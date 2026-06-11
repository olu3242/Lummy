import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getTopReferrers } from "@/lib/referrals"
import { getPlatformCollaborationSummary } from "@/lib/collaboration"
import { getPlatformCustomerSummary } from "@/lib/customers/intelligence"
import { getMonetizationSegments } from "@/lib/revenue/monetization"
import { getPlatformCommerceOps } from "@/lib/commerce/operations"

async function isAdmin(supabase: ReturnType<typeof createAdminClient>, userId: string): Promise<boolean> {
  const { data } = await supabase.from("users").select("is_admin, email").eq("id", userId).maybeSingle()
  const u = data as { is_admin: boolean; email: string } | null
  return u?.is_admin === true || u?.email?.endsWith("@lummy.co") === true
}

export async function GET() {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isAdmin(admin, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [referrers, collabs, customers, segments, commerceOps] = await Promise.allSettled([
    getTopReferrers(10),
    getPlatformCollaborationSummary(),
    getPlatformCustomerSummary(),
    getMonetizationSegments(),
    getPlatformCommerceOps(),
  ])

  // Referral network stats
  const { data: referralCounts } = await admin
    .from("creator_referrals")
    .select("status")

  const refRows = (referralCounts as { status: string }[] | null) ?? []
  const referralStats = {
    totalReferrals: refRows.length,
    activated: refRows.filter(r => r.status === "activated" || r.status === "rewarded").length,
    rewarded: refRows.filter(r => r.status === "rewarded").length,
    topReferrers: referrers.status === "fulfilled" ? referrers.value : [],
  }

  return NextResponse.json({
    referrals: referralStats,
    collaborations: collabs.status === "fulfilled" ? collabs.value : null,
    customers: customers.status === "fulfilled" ? customers.value : null,
    monetizationSegments: segments.status === "fulfilled" ? segments.value : [],
    commerceOps: commerceOps.status === "fulfilled" ? commerceOps.value : null,
  })
}
