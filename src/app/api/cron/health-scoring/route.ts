import { NextResponse, type NextRequest } from "next/server"
import { runHealthScoringJob } from "@/lib/jobs/workers"
import { logger } from "@/lib/observability/logger"

export const maxDuration = 300

function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get("authorization")
  return auth === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  logger.info("[cron] health_scoring started")
  const result = await runHealthScoringJob()
  logger.info("[cron] health_scoring complete", { ok: result.ok, durationMs: result.durationMs, processed: result.processed })

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
