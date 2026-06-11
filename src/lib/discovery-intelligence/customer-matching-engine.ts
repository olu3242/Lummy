/**
 * Customer Matching Engine — matches customers to high-affinity creators
 * based on browsing behavior and purchase history.
 *
 * Reads from: orders, creator_metrics_daily, creator_profiles
 * Emits:      customer_match_high_confidence, customer_loyalty_accelerated
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { DiscoveryIntelligenceRunResult } from "./discovery-events"

export async function runCustomerMatchingEngine(limit = 200): Promise<DiscoveryIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("match")
  const today = new Date().toISOString().split("T")[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    // Find creators with repeat customers (high affinity signal)
    const { data: repeatOrders } = await supabase
      .from("orders")
      .select("creator_id, customer_id, status")
      .eq("status", "completed")
      .gte("created_at", thirtyDaysAgo)
      .not("customer_id", "is", null)
      .limit(limit * 5)

    // Group by creator → count orders per customer
    const creatorCustomerMap = new Map<string, Map<string, number>>()
    for (const o of (repeatOrders ?? []) as { creator_id: string; customer_id: string; status: string }[]) {
      if (!creatorCustomerMap.has(o.creator_id)) {
        creatorCustomerMap.set(o.creator_id, new Map())
      }
      const customerMap = creatorCustomerMap.get(o.creator_id)!
      customerMap.set(o.customer_id, (customerMap.get(o.customer_id) ?? 0) + 1)
    }

    for (const [creatorId, customerMap] of creatorCustomerMap.entries()) {
      const repeatCustomers = [...customerMap.values()].filter(count => count >= 2).length
      const totalCustomers  = customerMap.size
      const loyaltyRate     = totalCustomers > 0 ? repeatCustomers / totalCustomers : 0

      // High loyalty: ≥30% repeat customers
      if (loyaltyRate >= 0.3 && totalCustomers >= 3) {
        const loyaltyScore = Math.round(loyaltyRate * 100)

        await emitEvent("customer_loyalty_accelerated", {
          tenantId: creatorId, creatorId, correlationId,
        }, {
          creatorId,
          loyalCustomers: repeatCustomers,
          avgRepeatRate:  loyaltyRate,
          loyaltyScore,
          snapshotDate:   today,
        }, `loyalty_accel:${creatorId}:${today}`)
        eventsEmitted++
        signals.push(`loyalty:${creatorId}:${(loyaltyRate * 100).toFixed(0)}%:${repeatCustomers}loyal`)
      }

      // High-confidence match: customers with ≥3 orders are verified loyal
      const highAffinityCustomers = [...customerMap.entries()]
        .filter(([, count]) => count >= 3)
        .map(([customerId]) => customerId)

      for (const customerId of highAffinityCustomers.slice(0, 5)) {
        const orderCount = customerMap.get(customerId) ?? 0
        const matchScore = Math.min(100, orderCount * 20)

        await emitEvent("customer_match_high_confidence", {
          tenantId: creatorId, creatorId, correlationId,
        }, {
          customerId,
          creatorId,
          matchScore,
          matchSignals:            [`${orderCount}_completed_orders`, "repeat_buyer"],
          estimatedConversionLift: Math.round((matchScore / 100) * 60),
          snapshotDate:            today,
        }, `customer_match:${creatorId}:${customerId}:${today}`)
        eventsEmitted++
      }
    }

    logger.info("[customer-matching] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[customer-matching] engine failed", { error: String(err) })
  }

  return { module: "customer-matching", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals }
}
