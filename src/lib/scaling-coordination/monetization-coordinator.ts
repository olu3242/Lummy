import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ScalingCoordinationRunResult } from "./scaling-events"

export async function runMonetizationCoordinator(): Promise<ScalingCoordinationRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("monetization")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString()
    const sevenDaysAgo    = new Date(Date.now() - 7 * 86_400_000).toISOString()

    // ── GMV per day for last 14 days ─────────────────────────────────────────
    const { data: gmvOrders } = await supabase
      .from("orders")
      .select("total_amount_kobo, created_at")
      .eq("status", "completed")
      .gte("created_at", fourteenDaysAgo)

    const dayBuckets = new Map<string, number>()
    for (const o of (gmvOrders ?? []) as { total_amount_kobo: number; created_at: string }[]) {
      const day = o.created_at.split("T")[0]
      dayBuckets.set(day, (dayBuckets.get(day) ?? 0) + (o.total_amount_kobo ?? 0))
    }

    const sortedDays = [...dayBuckets.keys()].sort()
    const recent7 = sortedDays.slice(-7)
    const prior7  = sortedDays.slice(0, 7)

    const recentAvg7d = recent7.length > 0
      ? recent7.reduce((s, d) => s + (dayBuckets.get(d) ?? 0), 0) / recent7.length
      : 0
    const priorAvg7d  = prior7.length > 0
      ? prior7.reduce((s, d) => s + (dayBuckets.get(d) ?? 0), 0) / prior7.length
      : 0

    const magnitude = recentAvg7d / Math.max(priorAvg7d, 1)

    if (magnitude > 2.0) {
      await emitEvent("monetization_anomaly", {
        tenantId: "platform", creatorId: "platform", correlationId,
      }, {
        anomalyType: "sudden_revenue_spike",
        magnitude,
        expectedValue: priorAvg7d,
        observedValue: recentAvg7d,
        snapshotDate: today,
      }, `monetization_anomaly:sudden_revenue_spike:${today}`)
      eventsEmitted++
      signals.push(`revenue_spike:magnitude=${magnitude.toFixed(2)}x`)
    } else if (magnitude < 0.5 && priorAvg7d > 0) {
      await emitEvent("monetization_anomaly", {
        tenantId: "platform", creatorId: "platform", correlationId,
      }, {
        anomalyType: "sudden_revenue_drop",
        magnitude,
        expectedValue: priorAvg7d,
        observedValue: recentAvg7d,
        snapshotDate: today,
      }, `monetization_anomaly:sudden_revenue_drop:${today}`)
      eventsEmitted++
      signals.push(`revenue_drop:magnitude=${magnitude.toFixed(2)}x`)
    }

    // ── Refund rate in last 7d ───────────────────────────────────────────────
    const { data: recent7dOrders } = await supabase
      .from("orders")
      .select("status")
      .gte("created_at", sevenDaysAgo)
      .in("status", ["completed", "refunded"])

    const recentOrderRows = (recent7dOrders ?? []) as { status: string }[]
    const totalRecent   = recentOrderRows.length
    const refundedCount = recentOrderRows.filter(o => o.status === "refunded").length
    const refundRate    = totalRecent > 0 ? refundedCount / totalRecent : 0

    if (refundRate > 0.15) {
      await emitEvent("monetization_anomaly", {
        tenantId: "platform", creatorId: "platform", correlationId,
      }, {
        anomalyType: "abnormal_refund_rate",
        magnitude: refundRate,
        expectedValue: 0.05, // baseline expected refund rate
        observedValue: refundRate,
        snapshotDate: today,
      }, `monetization_anomaly:abnormal_refund_rate:${today}`)
      eventsEmitted++
      signals.push(`abnormal_refund_rate:${(refundRate * 100).toFixed(1)}%`)
    }

    logger.info("[monetization-coordinator] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[monetization-coordinator] engine failed", { error: String(err) })
    return { module: "monetization-coordinator", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [String(err)] }
  }

  return { module: "monetization-coordinator", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
