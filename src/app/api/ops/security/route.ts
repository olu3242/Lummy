import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

async function isAdmin(supabase: ReturnType<typeof createAdminClient>, userId: string, email?: string): Promise<boolean> {
  const { data } = await supabase
    .from("creator_profiles")
    .select("is_admin")
    .eq("user_id", userId)
    .maybeSingle()
  return (data as { is_admin?: boolean } | null)?.is_admin === true || email?.endsWith("@lummy.co") === true
}

// security_events (migration 041) and reconciliation_alerts (migration 058) are
// both written by trusted server code but had no admin-facing surface to read
// or resolve them — they were write-only tables. This closes that gap.
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isAdmin(admin, user.id, user.email ?? undefined))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [securityRes, reconciliationRes] = await Promise.allSettled([
    admin
      .from("security_events")
      .select("id, event_type, severity, organization_id, endpoint, details, created_at")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("reconciliation_alerts")
      .select("id, organization_id, order_id, payment_id, anomaly_type, amount, detail, created_at")
      .is("resolved_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  const securityEvents = securityRes.status === "fulfilled" ? (securityRes.value.data ?? []) : []
  const reconciliationAlerts = reconciliationRes.status === "fulfilled" ? (reconciliationRes.value.data ?? []) : []

  const severityCounts = securityEvents.reduce<Record<string, number>>((acc, e) => {
    const sev = (e as { severity: string }).severity
    acc[sev] = (acc[sev] ?? 0) + 1
    return acc
  }, {})

  const amountAtRisk = reconciliationAlerts.reduce((sum, a) => sum + Number((a as { amount: number }).amount), 0)

  return NextResponse.json({
    securityEvents,
    severityCounts,
    reconciliationAlerts,
    amountAtRisk,
    generatedAt: new Date().toISOString(),
  })
}

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isAdmin(admin, user.id, user.email ?? undefined))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null) as { type?: "security_event" | "reconciliation_alert"; id?: string } | null
  if (!body?.type || !body?.id) return NextResponse.json({ error: "type and id required" }, { status: 400 })

  if (body.type === "security_event") {
    const { error } = await admin.from("security_events").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await admin.from("reconciliation_alerts").update({ resolved_at: new Date().toISOString() }).eq("id", body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
