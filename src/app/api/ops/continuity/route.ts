import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { runPaymentContinuityAudit } from "@/lib/payments/continuity"
import { runWhatsAppContinuityAudit } from "@/lib/whatsapp/continuity"
import { runCronContinuityAudit } from "@/lib/jobs/continuity"
import { runNotificationContinuityAudit } from "@/lib/notifications/continuity"
import { runStorageContinuityAudit } from "@/lib/storage/continuity"
import { runCreatorJourneyAudit } from "@/lib/creator/journey"

export const dynamic = "force-dynamic"
export const maxDuration = 30

async function isAdmin(supabase: ReturnType<typeof createAdminClient>, userId: string, email?: string): Promise<boolean> {
  const { data } = await supabase
    .from("creator_profiles")
    .select("is_admin")
    .eq("user_id", userId)
    .maybeSingle()
  return (data as { is_admin?: boolean } | null)?.is_admin === true || email?.endsWith("@lummy.co") === true
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isAdmin(admin, user.id, user.email ?? undefined))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [payments, whatsapp, cron, notifications, storage, journey] = await Promise.allSettled([
    runPaymentContinuityAudit(),
    runWhatsAppContinuityAudit(),
    runCronContinuityAudit(),
    runNotificationContinuityAudit(),
    runStorageContinuityAudit(),
    runCreatorJourneyAudit(),
  ])

  const p = payments.status === "fulfilled" ? payments.value : null
  const w = whatsapp.status === "fulfilled" ? whatsapp.value : null
  const c = cron.status === "fulfilled" ? cron.value : null
  const n = notifications.status === "fulfilled" ? notifications.value : null
  const s = storage.status === "fulfilled" ? storage.value : null
  const j = journey.status === "fulfilled" ? journey.value : null

  const scores = [p?.score, w?.score, c?.score, n?.score, s?.score, j?.score]
    .filter((x): x is number => x !== undefined)
  const overallScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  const allIssues = [
    ...(p?.issues ?? []),
    ...(w?.issues ?? []),
    ...(c?.issues ?? []),
    ...(n?.issues ?? []),
    ...(s?.issues ?? []),
    ...(j?.issues ?? []),
  ]

  return NextResponse.json({
    overallScore,
    ready: allIssues.length === 0,
    totalIssues: allIssues.length,
    payments: p,
    whatsapp: w,
    cron: c,
    notifications: n,
    storage: s,
    journey: j,
    generatedAt: new Date().toISOString(),
  })
}
