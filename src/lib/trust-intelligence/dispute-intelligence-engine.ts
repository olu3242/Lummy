/**
 * Dispute Intelligence Engine — analyzes refund and dispute trends to surface
 * creator dispute risk and platform-wide dispute spikes.
 *
 * Reads from: orders (status=refunded), automation_events
 * Emits:      creator_dispute_risk, dispute_spike_detected
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { TrustIntelligenceRunResult } from "./trust-events"

export async function runDisputeIntelligenceEngine(limit = 300): Promise<TrustIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("dispute")
  const today = new Date().toISOString().split("T")[0]
  const sevenDaysAgo    = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const priorSevenStart = new Date(Date.now() - 14 * 86_400_000).toISOString()
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    // Current 7d refunds
    const { data: recentRefunds } = await supabase
      .from("orders")
      .select("creator_id, id, status")
      .eq("status", "refunded")
      .gte("created_at", sevenDaysAgo)
      .limit(limit)

    // Prior 7d refunds for spike detection
    const { data: priorRefunds } = await supabase
      .from("orders")
      .select("creator_id")
      .eq("status", "refunded")
      .gte("created_at", priorSevenStart)
      .lt("created_at", sevenDaysAgo)

    // Total orders per creator for dispute rate
    const { data: totalOrders } = await supabase
      .from("orders")
      .select("creator_id, id")
      .gte("created_at", sevenDaysAgo)
      .limit(limit * 5)

    const refundsByCreator = new Map<string, number>()
    for (const r of (recentRefunds ?? []) as { creator_id: string }[]) {
      refundsByCreator.set(r.creator_id, (refundsByCreator.get(r.creator_id) ?? 0) + 1)
    }

    const priorRefundsByCreator = new Map<string, number>()
    for (const r of (priorRefunds ?? []) as { creator_id: string }[]) {
      priorRefundsByCreator.set(r.creator_id, (priorRefundsByCreator.get(r.creator_id) ?? 0) + 1)
    }

    const ordersByCreator = new Map<string, number>()
    for (const o of (totalOrders ?? []) as { creator_id: string }[]) {
      ordersByCreator.set(o.creator_id, (ordersByCreator.get(o.creator_id) ?? 0) + 1)
    }

    // Per-creator dispute risk
    for (const [creatorId, disputeCount] of refundsByCreator.entries()) {
      const totalCount = ordersByCreator.get(creatorId) ?? 1
      const disputeRate = disputeCount / totalCount

      const riskLevel: "low" | "medium" | "high" | "critical" =
        disputeRate > 0.3 ? "critical" :
        disputeRate > 0.15 ? "high" :
        disputeRate > 0.08 ? "medium" :
        "low"

      if (riskLevel === "high" || riskLevel === "critical") {
        await emitEvent("creator_dispute_risk", {
          tenantId: creatorId, creatorId, correlationId,
        }, {
          creatorId,
          disputeCount30d: disputeCount,
          disputeRate,
          riskLevel,
          snapshotDate: today,
        }, `dispute_risk:${creatorId}:${today}`)
        eventsEmitted++
        signals.push(`dispute:${creatorId}:${riskLevel}:${(disputeRate * 100).toFixed(0)}%`)
      }
    }

    // Platform-wide dispute spike detection
    const totalCurrentRefunds  = [...refundsByCreator.values()].reduce((s, v) => s + v, 0)
    const totalPriorRefunds    = [...priorRefundsByCreator.values()].reduce((s, v) => s + v, 0)

    if (totalPriorRefunds > 0 && totalCurrentRefunds > totalPriorRefunds * 1.5 && totalCurrentRefunds >= 5) {
      const spikePercent = Math.round((totalCurrentRefunds - totalPriorRefunds) / totalPriorRefunds * 100)
      await emitEvent("dispute_spike_detected", {
        tenantId: "platform", correlationId,
      }, {
        disputeCount7d:      totalCurrentRefunds,
        disputeCountPrior7d: totalPriorRefunds,
        spikePercent,
        snapshotDate:        today,
      }, `dispute_spike:${today}`)
      eventsEmitted++
      signals.push(`platform_dispute_spike:${spikePercent}%`)
    }

    logger.info("[dispute-intelligence] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[dispute-intelligence] engine failed", { error: String(err) })
  }

  return { module: "dispute-intelligence", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
