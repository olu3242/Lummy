import { NextResponse, type NextRequest } from "next/server"
import { runAutomationProcessorJob } from "@/lib/jobs/workers"
import { logger } from "@/lib/observability/logger"
import { verifyCronSecret } from "@/lib/runtime/cron"

// Runs every 2 minutes — processes pending automation_events in batches.
// This is the heartbeat of the canonical runtime spine.
export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  logger.info("[cron] automation_processor started")
  const result = await runAutomationProcessorJob(50)
  logger.info("[cron] automation_processor complete", result as unknown as Record<string, unknown>)

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
