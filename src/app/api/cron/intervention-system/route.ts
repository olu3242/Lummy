import { NextResponse, type NextRequest } from "next/server"
import { runInterventionSystemJob } from "@/lib/jobs/workers"
import { logger } from "@/lib/observability/logger"
import { verifyCronSecret } from "@/lib/runtime/cron"

export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  logger.info("[cron] intervention_system started")
  const result = await runInterventionSystemJob()
  logger.info("[cron] intervention_system complete", result as unknown as Record<string, unknown>)

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
