import { NextResponse, type NextRequest } from "next/server"
import { runChurnScoringJob } from "@/lib/creator/churn"
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

  logger.info("[cron] churn_scoring started")
  const start = Date.now()
  try {
    const result = await runChurnScoringJob()
    const durationMs = Date.now() - start
    logger.info("[cron] churn_scoring complete", { scored: result.scored, critical: result.critical, durationMs })
    return NextResponse.json({ ok: true, durationMs, ...result })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
