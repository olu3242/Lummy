import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getBetaCohortSummary, getOnboardingHeatSummary, getFrictionTrendReport } from "@/lib/analytics/cohort"
import { getPlatformFirstSaleStats } from "@/lib/creator/first-sale"
import { getPlatformWhatsAppSummary } from "@/lib/commerce/whatsapp-optimizer"
import { getRetentionValidationReport, getLifecycleAutomationSummary } from "@/lib/creator/retention-validator"

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

  const [cohorts, onboarding, friction, firstSale, whatsapp, retention, lifecycle] = await Promise.allSettled([
    getBetaCohortSummary(6),
    getOnboardingHeatSummary(),
    getFrictionTrendReport(),
    getPlatformFirstSaleStats(),
    getPlatformWhatsAppSummary(),
    getRetentionValidationReport(),
    getLifecycleAutomationSummary(),
  ])

  return NextResponse.json({
    cohorts:   cohorts.status === "fulfilled" ? cohorts.value : [],
    onboarding: onboarding.status === "fulfilled" ? onboarding.value : null,
    friction:  friction.status === "fulfilled" ? friction.value : null,
    firstSale: firstSale.status === "fulfilled" ? firstSale.value : null,
    whatsapp:  whatsapp.status === "fulfilled" ? whatsapp.value : null,
    retention: retention.status === "fulfilled" ? retention.value : null,
    lifecycle: lifecycle.status === "fulfilled" ? lifecycle.value : null,
  })
}
