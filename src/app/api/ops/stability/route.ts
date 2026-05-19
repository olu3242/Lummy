import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { runSecurityAudit, auditRouteAuth } from "@/lib/security/audit"
import { verifyMigrationHealth } from "@/lib/migrations/verify"
import { computeReadiness } from "@/lib/runtime/readiness"
import { computeLaunchReadiness } from "@/lib/runtime/launch"

export const dynamic = "force-dynamic"

async function isAdmin(supabase: ReturnType<typeof createAdminClient>, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("creator_profiles")
    .select("is_admin")
    .eq("user_id", userId)
    .maybeSingle()
  const p = data as { is_admin?: boolean } | null
  return p?.is_admin === true
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  const adminOk = await isAdmin(admin, user.id) || user.email?.endsWith("@lummy.co")
  if (!adminOk) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [readiness, launch, migrations, security] = await Promise.allSettled([
    computeReadiness(),
    computeLaunchReadiness(),
    verifyMigrationHealth(),
    runSecurityAudit(),
  ])

  const routeAuth = auditRouteAuth()

  const r = readiness.status === "fulfilled" ? readiness.value : null
  const l = launch.status === "fulfilled" ? launch.value : null
  const m = migrations.status === "fulfilled" ? migrations.value : null
  const s = security.status === "fulfilled" ? security.value : null

  // Composite stability score
  const scores = [r?.score, l?.score, m?.score, s?.score].filter((x): x is number => x !== undefined)
  const stabilityScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

  const criticalIssues: string[] = [
    ...(r?.blockers ?? []),
    ...(l?.blockers ?? []),
    ...(m?.missing.map(t => `Missing table: ${t}`) ?? []),
    ...(s?.criticalIssues ?? []),
    ...routeAuth.filter(ra => !ra.ok && ra.authType === "cron_secret").map(ra => `${ra.path}: ${ra.note ?? "auth misconfigured"}`),
  ]

  const warnings: string[] = [
    ...(r?.warnings ?? []),
    ...(l?.warnings ?? []),
    ...(s?.warnings ?? []),
    ...routeAuth.filter(ra => !ra.ok && ra.authType !== "cron_secret").map(ra => ra.note ?? `${ra.path}: review auth`),
  ]

  return NextResponse.json({
    stabilityScore,
    ready: criticalIssues.length === 0,
    criticalIssues,
    warnings,
    readiness: r,
    launch: l,
    migrations: m,
    security: { score: s?.score, criticalIssues: s?.criticalIssues, warnings: s?.warnings },
    routeAuth,
    generatedAt: new Date().toISOString(),
  })
}
