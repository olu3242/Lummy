import { NextRequest, NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/runtime/cron"
import { runIntelligenceScoringJob } from "@/lib/jobs/workers"
import { logger } from "@/lib/observability/logger"

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  logger.info("[cron] intelligence-scoring started")
  const result = await runIntelligenceScoringJob()
  logger.info("[cron] intelligence-scoring complete", result as unknown as Record<string, unknown>)

  return NextResponse.json(result)
}
