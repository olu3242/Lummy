import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { computeLaunchReadiness } from "@/lib/runtime/launch"
import { runAllSmokeTests } from "@/lib/testing/smoke"

export const dynamic = "force-dynamic"

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

  const [readiness, smoke] = await Promise.all([
    computeLaunchReadiness(),
    runAllSmokeTests(),
  ])

  const smokeResults = smoke.results
  const overallReady = readiness.ready && smoke.allPassed
  const score = Math.round(
    (readiness.score + (smokeResults.filter(s => s.ok).length / (smokeResults.length || 1)) * 100) / 2
  )

  return NextResponse.json({
    ready: overallReady,
    score,
    readiness,
    smoke,
    generatedAt: new Date().toISOString(),
  })
}
