import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getPlatformFirstSaleStats } from "@/lib/creator/first-sale"
import { getPlatformActionStats } from "@/lib/creator/actions"
import { getPlatformMonetizationSummary } from "@/lib/creator/monetization-scorecard"
import { getPlatformEcosystemHealth } from "@/lib/ecosystem/participation"

async function isAdmin(supabase: ReturnType<typeof createAdminClient>, userId: string): Promise<boolean> {
  const { data } = await supabase.from("users").select("is_admin, email").eq("id", userId).maybeSingle()
  const u = data as { is_admin: boolean; email: string } | null
  return u?.is_admin === true || u?.email?.endsWith("@lummy.co") === true
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isAdmin(admin, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [firstSale, actions, monetization, ecosystem] = await Promise.allSettled([
    getPlatformFirstSaleStats(),
    getPlatformActionStats(),
    getPlatformMonetizationSummary(),
    getPlatformEcosystemHealth(),
  ])

  return NextResponse.json({
    firstSale:    firstSale.status === "fulfilled" ? firstSale.value : null,
    actions:      actions.status === "fulfilled" ? actions.value : null,
    monetization: monetization.status === "fulfilled" ? monetization.value : null,
    ecosystem:    ecosystem.status === "fulfilled" ? ecosystem.value : null,
  })
}
