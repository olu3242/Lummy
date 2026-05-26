/**
 * Fraud Risk Engine — lightweight pattern-based fraud detection for checkouts
 * and payments. Deterministic, observable, NO external ML dependencies.
 *
 * Reads from: orders, automation_events
 * Emits:      customer_fraud_risk
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { TrustIntelligenceRunResult } from "./trust-events"

interface FraudSignal {
  type: string
  weight: number
}

function computeFraudScore(signals: FraudSignal[]): number {
  return Math.min(100, signals.reduce((s, f) => s + f.weight, 0))
}

export async function runFraudRiskEngine(): Promise<TrustIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("fraud")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const oneDayAgo    = new Date(Date.now() - 86_400_000).toISOString()
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

    // Pattern 1: creators with abnormally high refund rates in 7d
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("creator_id, status, created_at")
      .gte("created_at", sevenDaysAgo)
      .in("status", ["completed", "refunded", "payment_failed"])

    const creatorOrderMap = new Map<string, { total: number; refunded: number; failed: number }>()
    for (const o of (recentOrders ?? []) as { creator_id: string; status: string }[]) {
      const c = creatorOrderMap.get(o.creator_id) ?? { total: 0, refunded: 0, failed: 0 }
      c.total++
      if (o.status === "refunded")        c.refunded++
      if (o.status === "payment_failed")  c.failed++
      creatorOrderMap.set(o.creator_id, c)
    }

    for (const [creatorId, stats] of creatorOrderMap.entries()) {
      if (stats.total < 3) continue

      const fraudSignals: FraudSignal[] = []
      const refundRate = stats.refunded / stats.total
      const failRate   = stats.failed / stats.total

      if (refundRate > 0.3)  fraudSignals.push({ type: "high_refund_rate", weight: 40 })
      if (refundRate > 0.15) fraudSignals.push({ type: "elevated_refunds", weight: 20 })
      if (failRate > 0.4)    fraudSignals.push({ type: "high_payment_failure", weight: 35 })
      if (failRate > 0.2)    fraudSignals.push({ type: "elevated_failures", weight: 15 })

      const fraudScore = computeFraudScore(fraudSignals)
      if (fraudScore >= 40) {
        const action = fraudScore >= 70 ? "flag" : "monitor"
        await emitEvent("customer_fraud_risk", {
          tenantId: creatorId, creatorId, correlationId,
        }, {
          creatorId,
          fraudSignals:      fraudSignals.map(f => f.type),
          riskScore:         fraudScore,
          recommendedAction: action,
          snapshotDate:      today,
        }, `fraud_risk:${creatorId}:${today}`)
        eventsEmitted++
        signals.push(`fraud:${creatorId}:score${fraudScore}:${action}`)
      }
    }

    // Pattern 2: rapid-fire payment failures in 24h (velocity attack signal)
    const { data: failedPayments } = await supabase
      .from("automation_events")
      .select("creator_id, created_at")
      .eq("event_name", "payment_failed")
      .gte("created_at", oneDayAgo)

    const failVelocity = new Map<string, number>()
    for (const ev of (failedPayments ?? []) as { creator_id: string }[]) {
      failVelocity.set(ev.creator_id, (failVelocity.get(ev.creator_id) ?? 0) + 1)
    }

    for (const [creatorId, count] of failVelocity.entries()) {
      if (count >= 5 && !creatorOrderMap.has(creatorId)) {
        await emitEvent("customer_fraud_risk", {
          tenantId: creatorId, creatorId, correlationId,
        }, {
          creatorId,
          fraudSignals:      [`${count}_payment_failures_24h`],
          riskScore:         Math.min(100, count * 12),
          recommendedAction: count >= 8 ? "block" : "flag",
          snapshotDate:      today,
        }, `fraud_velocity:${creatorId}:${today}`)
        eventsEmitted++
      }
    }

    logger.info("[fraud-risk] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[fraud-risk] engine failed", { error: String(err) })
  }

  return { module: "fraud-risk", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
