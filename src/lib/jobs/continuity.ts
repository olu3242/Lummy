import { createAdminClient } from "@/lib/supabase/server"

const EXPECTED_JOBS = [
  "health_scoring",
  "churn_scoring",
  "analytics_rollup",
  "notification_cleanup",
] as const

export interface JobContinuityStatus {
  jobName: string
  lastRunAt: string | null
  lastStatus: string | null
  hoursSinceRun: number | null
  stale: boolean          // >26h since last successful run
  failureStreak: number   // consecutive failures
}

export interface CronContinuityReport {
  generatedAt: string
  score: number
  cronSecretConfigured: boolean
  jobs: JobContinuityStatus[]
  staleJobs: number
  failingJobs: number
  issues: string[]
  recommendations: string[]
}

export async function runCronContinuityAudit(): Promise<CronContinuityReport> {
  const supabase = createAdminClient()
  const issues: string[] = []
  const recommendations: string[] = []

  const cronSecretConfigured = (process.env.CRON_SECRET ?? "").length > 0

  if (!cronSecretConfigured) {
    issues.push("CRON_SECRET not set — all cron endpoints will reject requests (fail-closed)")
  }

  const { data: recentRuns } = await supabase
    .from("job_runs")
    .select("job_name, status, completed_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100)

  const runs = (recentRuns ?? []) as Array<{
    job_name: string
    status: string
    completed_at: string | null
    created_at: string
  }>

  const jobs: JobContinuityStatus[] = EXPECTED_JOBS.map(jobName => {
    const jobRuns = runs.filter(r => r.job_name === jobName)
    const lastRun = jobRuns[0] ?? null
    const lastSuccessful = jobRuns.find(r => r.status === "success")

    const lastRunAt = lastRun?.created_at ?? null
    const lastStatus = lastRun?.status ?? null
    const hoursSinceRun = lastSuccessful
      ? (Date.now() - new Date(lastSuccessful.created_at).getTime()) / 3_600_000
      : null

    const stale = hoursSinceRun === null || hoursSinceRun > 26

    // Count consecutive failures from the top
    let failureStreak = 0
    for (const run of jobRuns) {
      if (run.status === "success") break
      failureStreak++
    }

    return { jobName, lastRunAt, lastStatus, hoursSinceRun: hoursSinceRun ? Math.round(hoursSinceRun) : null, stale, failureStreak }
  })

  const staleJobs = jobs.filter(j => j.stale).length
  const failingJobs = jobs.filter(j => j.failureStreak > 0).length

  if (staleJobs > 0) issues.push(`${staleJobs} cron jobs have not run in >26h`)
  if (failingJobs > 0) issues.push(`${failingJobs} cron jobs have consecutive failures`)
  if (!cronSecretConfigured) recommendations.push("Set CRON_SECRET in Vercel environment variables to enable scheduled jobs")

  const score = Math.max(0, 100 - (staleJobs * 20) - (failingJobs * 15) - (!cronSecretConfigured ? 20 : 0))

  return {
    generatedAt: new Date().toISOString(),
    score: Math.min(100, score),
    cronSecretConfigured,
    jobs,
    staleJobs,
    failingJobs,
    issues,
    recommendations,
  }
}
