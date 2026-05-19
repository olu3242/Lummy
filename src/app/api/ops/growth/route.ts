import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getCreatorGrowthMetrics } from "@/lib/analytics/metrics"
import { getHealthDistribution } from "@/lib/growth/health"

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Check admin — only allow ops staff (service-role check via is_admin flag or email domain)
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("creator_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  const isAdmin = (profile as { is_admin?: boolean } | null)?.is_admin === true
    || user.email?.endsWith("@lummy.co")

  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [growth, health] = await Promise.all([
    getCreatorGrowthMetrics(),
    getHealthDistribution(),
  ])

  return NextResponse.json({ growth, health })
}
