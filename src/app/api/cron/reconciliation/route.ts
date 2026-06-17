import { NextResponse, type NextRequest } from "next/server"
import { runPaymentReconciliation } from "@/lib/payments/audit"
import { logger } from "@/lib/observability/logger"
import { verifyCronSecret } from "@/lib/runtime/cron"

export const maxDuration = 60
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  logger.info("[cron] payment_reconciliation started")
  try {
    const anomalies = await runPaymentReconciliation()
    logger.info("[cron] payment_reconciliation complete", { anomalyCount: anomalies.length })
    return NextResponse.json({ ok: true, anomalyCount: anomalies.length }, { status: 200 })
  } catch (err) {
    logger.error("[cron] payment_reconciliation failed", { error: String(err) })
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
