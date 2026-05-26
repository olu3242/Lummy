/**
 * Transaction Safety Engine — detects suspicious payment and checkout patterns.
 *
 * Reads from: automation_events (payment_failed, checkout_abandoned), orders
 * Emits:      suspicious_checkout_detected, customer_trust_risk
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { TrustIntelligenceRunResult } from "./trust-events"

export async function runTransactionSafetyEngine(limit = 500): Promise<TrustIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("txsafe")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString()

    // Detect velocity anomalies: creators with abnormal payment failure rates in 24h
    const { data: failedEvents } = await supabase
      .from("automation_events")
      .select("creator_id, payload, created_at")
      .eq("event_name", "payment_failed")
      .gte("created_at", oneDayAgo)
      .limit(limit)

    const failedByCreator = new Map<string, number>()
    for (const ev of (failedEvents ?? []) as { creator_id: string; payload: Record<string, unknown>; created_at: string }[]) {
      failedByCreator.set(ev.creator_id, (failedByCreator.get(ev.creator_id) ?? 0) + 1)
    }

    // Detect abandoned checkout spikes: >5 in 24h from same creator
    const { data: abandonedEvents } = await supabase
      .from("automation_events")
      .select("creator_id, payload, created_at")
      .eq("event_name", "checkout_abandoned")
      .gte("created_at", oneDayAgo)
      .limit(limit)

    const abandonedByCreator = new Map<string, number>()
    for (const ev of (abandonedEvents ?? []) as { creator_id: string; payload: Record<string, unknown> }[]) {
      abandonedByCreator.set(ev.creator_id, (abandonedByCreator.get(ev.creator_id) ?? 0) + 1)
    }

    // Emit suspicious_checkout_detected for creators with unusual patterns
    for (const [creatorId, failCount] of failedByCreator.entries()) {
      const abandonCount = abandonedByCreator.get(creatorId) ?? 0

      // Abnormal: >3 payment failures AND >5 abandons in 24h = suspicious pattern
      if (failCount >= 3 && abandonCount >= 5) {
        await emitEvent("suspicious_checkout_detected", {
          tenantId: creatorId, creatorId, correlationId,
        }, {
          creatorId,
          signals:     [`${failCount}_payment_failures`, `${abandonCount}_abandoned_checkouts`],
          anomalyType: "pattern",
          snapshotDate: today,
        }, `suspicious_checkout:${creatorId}:${today}`)
        eventsEmitted++
        signals.push(`suspicious:${creatorId}:f${failCount}a${abandonCount}`)
      }
    }

    // Emit customer_trust_risk for high abandon-rate patterns per creator
    for (const [creatorId, abandonCount] of abandonedByCreator.entries()) {
      if (abandonCount >= 10) {
        await emitEvent("customer_trust_risk", {
          tenantId: creatorId, creatorId, correlationId,
        }, {
          creatorId,
          riskSignals:  [`${abandonCount}_checkouts_abandoned_24h`],
          riskScore:    Math.min(100, abandonCount * 5),
          snapshotDate: today,
        }, `customer_trust_risk:${creatorId}:${today}`)
        eventsEmitted++
      }
    }

    logger.info("[transaction-safety] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[transaction-safety] engine failed", { error: String(err) })
  }

  return { module: "transaction-safety", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
