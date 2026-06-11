import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { ALL_JOBS } from "@/lib/jobs/workers"
import { logger } from "@/lib/observability/logger"

/**
 * POST /api/jobs/run
 * Body: { job: "health_scoring" | "automation_processor" | "webhook_retry" | "notification_cleanup" | "all" }
 *
 * Authorization: Bearer ${CRON_SECRET}
 * Safe to call from Vercel Cron, Supabase Cron, or manually for ops.
 */
export async function POST(request: NextRequest) {
  // Bearer token auth — prevents public abuse
  const auth = request.headers.get("authorization") ?? ""
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const jobName = (body as { job?: string }).job ?? "all"

  const supabase = createAdminClient()
  const runId = crypto.randomUUID()

  // Log job start
  void Promise.resolve(supabase.from("job_runs").insert({
    id: runId,
    job_name: jobName,
    status: "running",
    metadata: { requestedAt: new Date().toISOString() },
  })).catch(() => {})

  try {
    const toRun = jobName === "all"
      ? Object.entries(ALL_JOBS)
      : Object.entries(ALL_JOBS).filter(([name]) => name === jobName)

    if (toRun.length === 0) {
      return NextResponse.json({ error: `Unknown job: ${jobName}` }, { status: 400 })
    }

    const results = await Promise.all(toRun.map(([, fn]) => fn()))
    const allOk = results.every(r => r.ok)

    void Promise.resolve(supabase.from("job_runs").update({
      status: allOk ? "success" : "failed",
      completed_at: new Date().toISOString(),
      metadata: { results },
    }).eq("id", runId)).catch(() => {})

    logger.info("[jobs] run complete", { jobName, results })
    return NextResponse.json({ ok: allOk, results })
  } catch (err) {
    void Promise.resolve(supabase.from("job_runs").update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_message: String(err),
    }).eq("id", runId)).catch(() => {})

    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
