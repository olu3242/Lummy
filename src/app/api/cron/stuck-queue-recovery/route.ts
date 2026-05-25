import { NextResponse, type NextRequest } from "next/server"
import { runStuckQueueRecoveryJob } from "@/lib/jobs/workers"
import { logger } from "@/lib/observability/logger"
import { verifyCronSecret } from "@/lib/runtime/cron"

export const maxDuration = 60


export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  logger.info("[cron] stuck_queue_recovery started")
  const result = await runStuckQueueRecoveryJob()
  logger.info("[cron] stuck_queue_recovery complete", result as unknown as Record<string, unknown>)

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
