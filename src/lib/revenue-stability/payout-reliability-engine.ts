import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { StabilityRunResult } from "./monetization-continuity-engine"

export async function runPayoutReliabilityEngine(limit = 200): Promise<StabilityRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("payout-reliability")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  try {
    const [failedEventsRes, completedOrdersRes] = await Promise.allSettled([
      supabase
        .from("automation_events")
        .select("creator_id")
        .eq("event_name", "payment_failed")
        .gte("created_at", sevenDaysAgo)
        .limit(limit * 10),
      supabase
        .from("orders")
        .select("creator_id")
        .eq("status", "completed")
        .gte("created_at", sevenDaysAgo)
        .limit(limit * 10),
    ])

    const failedByCreator = new Map<string, number>()
    if (failedEventsRes.status === "fulfilled") {
      for (const row of (failedEventsRes.value.data ?? []) as { creator_id: string }[]) {
        failedByCreator.set(row.creator_id, (failedByCreator.get(row.creator_id) ?? 0) + 1)
      }
    }

    const completedByCreator = new Map<string, number>()
    if (completedOrdersRes.status === "fulfilled") {
      for (const row of (completedOrdersRes.value.data ?? []) as { creator_id: string }[]) {
        completedByCreator.set(row.creator_id, (completedByCreator.get(row.creator_id) ?? 0) + 1)
      }
    }

    const candidateIds = [...new Set([...failedByCreator.keys()])]

    for (const creatorId of candidateIds.slice(0, limit)) {
      try {
        const failedCount    = failedByCreator.get(creatorId) ?? 0
        const completedCount = completedByCreator.get(creatorId) ?? 0
        const totalAttempts  = failedCount + completedCount
        const failureRate    = totalAttempts > 0 ? failedCount / totalAttempts : 0

        if (failedCount >= 3 && failureRate > 0.3) {
          await emitEvent(
            "payout_degradation_detected",
            { tenantId: creatorId, creatorId, correlationId },
            {
              creatorId,
              failedPaymentCount: failedCount,
              successfulOrderCount: completedCount,
              failureRate,
              snapshotDate: today,
            },
            `payout_degradation:${creatorId}:${today}`,
          )
          eventsEmitted++
          signals.push(`payout_degraded:${creatorId}:failed=${failedCount}:rate=${Math.round(failureRate * 100)}pct`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[payout-reliability] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[payout-reliability] engine failed", { error: String(err) })
  }

  return {
    module: "payout-reliability",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
  }
}
