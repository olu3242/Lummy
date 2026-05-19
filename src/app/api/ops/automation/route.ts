import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getChurnRiskDistribution } from "@/lib/creator/churn"

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

  const since24h = new Date(Date.now() - 86_400_000).toISOString()
  const since7d  = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [pendingRes, processedRes, failedRes, recentJobsRes, churnDist] = await Promise.allSettled([
    admin.from("automation_events").select("id", { count: "exact", head: true }).eq("processed", false),
    admin.from("automation_events").select("id", { count: "exact", head: true }).eq("processed", true).gte("processed_at", since24h),
    admin.from("automation_events").select("id", { count: "exact", head: true }).eq("processed", false).lt("created_at", since24h),
    admin.from("job_runs").select("job_name, status, completed_at, metadata").order("created_at", { ascending: false }).limit(10),
    getChurnRiskDistribution(),
  ])

  const get = (r: PromiseSettledResult<{ count: number | null }>): number =>
    r.status === "fulfilled" ? (r.value.count ?? 0) : 0

  return NextResponse.json({
    automation: {
      pendingEvents: get(pendingRes as PromiseSettledResult<{ count: number | null }>),
      processedLast24h: get(processedRes as PromiseSettledResult<{ count: number | null }>),
      stalledEvents: get(failedRes as PromiseSettledResult<{ count: number | null }>),
    },
    recentJobs: recentJobsRes.status === "fulfilled" ? recentJobsRes.value.data : [],
    churnRisk: churnDist.status === "fulfilled" ? churnDist.value : null,
    since7d,
  })
}
