import { NextRequest, NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/runtime/cron"
import { runCreatorSuccessMonitoringJob } from "@/lib/jobs/workers"
import { logger } from "@/lib/observability/logger"

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  logger.info("[cron] creator-success-monitoring started")
  const result = await runCreatorSuccessMonitoringJob()
  logger.info("[cron] creator-success-monitoring complete", result as unknown as Record<string, unknown>)

  return NextResponse.json(result)
}
