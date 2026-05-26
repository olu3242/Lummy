/**
 * Intent Discovery Engine — detects high-intent customer signals from
 * checkout starts, WA click spikes, and repeat storefront visits.
 *
 * Reads from: automation_events (checkout_started, checkout_abandoned)
 * Emits:      conversion_priority_high, customer_discovery_accelerated
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { DiscoveryIntelligenceRunResult } from "./discovery-events"

export async function runIntentDiscoveryEngine(limit = 300): Promise<DiscoveryIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("intent")
  const today = new Date().toISOString().split("T")[0]
  const sixHoursAgo = new Date(Date.now() - 6 * 3_600_000).toISOString()
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    // Checkout started but not abandoned in the last 6h = active high-intent customer
    const { data: startedEvents } = await supabase
      .from("automation_events")
      .select("creator_id, payload, created_at")
      .eq("event_name", "checkout_started")
      .gte("created_at", sixHoursAgo)
      .limit(limit)

    // Abandoned events for cross-reference
    const { data: abandonedEvents } = await supabase
      .from("automation_events")
      .select("creator_id, payload")
      .eq("event_name", "checkout_abandoned")
      .gte("created_at", sixHoursAgo)

    const abandonedByCreator = new Set(
      ((abandonedEvents ?? []) as { creator_id: string }[]).map(e => e.creator_id)
    )

    // Group started checkouts by creator
    const startedByCreator = new Map<string, number>()
    for (const ev of (startedEvents ?? []) as { creator_id: string }[]) {
      startedByCreator.set(ev.creator_id, (startedByCreator.get(ev.creator_id) ?? 0) + 1)
    }

    for (const [creatorId, startCount] of startedByCreator.entries()) {
      // High-intent signal: multiple checkouts started, none abandoned yet
      if (startCount >= 2 && !abandonedByCreator.has(creatorId)) {
        const windowMinutes = 60  // act within 60 minutes
        const estimatedRevenue = startCount * 500_000  // ₦5000 per order in kobo

        await emitEvent("conversion_priority_high", {
          tenantId: creatorId, creatorId, correlationId,
        }, {
          creatorId,
          priority:              "high_intent_customer",
          estimatedRevenueKobo:  estimatedRevenue,
          windowMinutes,
          snapshotDate:          today,
        }, `conv_priority:${creatorId}:${today}`)
        eventsEmitted++
        signals.push(`high_intent:${creatorId}:${startCount}checkouts`)
      }

      // Customer discovery signal: new high-intent customers found this creator today
      if (startCount >= 1) {
        await emitEvent("customer_discovery_accelerated", {
          tenantId: creatorId, creatorId, correlationId,
        }, {
          creatorId,
          discoveryType:   "intent_matched",
          customersMatched: startCount,
          snapshotDate:    today,
        }, `customer_disc:${creatorId}:${today}`)
        eventsEmitted++
      }
    }

    logger.info("[intent-discovery] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[intent-discovery] engine failed", { error: String(err) })
  }

  return { module: "intent-discovery", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals }
}
