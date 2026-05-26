import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { RetentionIntelligenceRunResult } from "./retention-events"

export async function runLoyaltyIntelligenceEngine(limit = 200): Promise<RetentionIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("loyalty")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let creatorsScored = 0

  const thirtyDaysAgo  = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const sevenDaysAgo   = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString()

  try {
    const { data: creators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    for (const creator of (creators ?? []) as { id: string }[]) {
      try {
        const creatorId = creator.id

        const { data: orders30d } = await supabase
          .from("orders")
          .select("customer_id, created_at")
          .eq("creator_id", creatorId)
          .gte("created_at", thirtyDaysAgo)

        const rows = (orders30d ?? []) as { customer_id: string; created_at: string }[]

        const customerOrderCounts = new Map<string, number>()
        for (const row of rows) {
          if (!row.customer_id) continue
          customerOrderCounts.set(row.customer_id, (customerOrderCounts.get(row.customer_id) ?? 0) + 1)
        }

        // Loyal = ≥3 orders in 30d
        const loyalEntries = [...customerOrderCounts.entries()].filter(([, count]) => count >= 3)
        const loyalCustomers = loyalEntries.length
        const avgOrdersPerLoyalCustomer = loyalCustomers > 0
          ? loyalEntries.reduce((s, [, c]) => s + c, 0) / loyalCustomers
          : 0

        const loyaltyScore = Math.min(100, loyalCustomers * 10 + avgOrdersPerLoyalCustomer * 5)

        const loyaltyTier: "bronze" | "silver" | "gold" | "champion" =
          loyalCustomers >= 10 ? "champion" :
          loyalCustomers >= 5  ? "gold" :
          loyalCustomers >= 2  ? "silver" :
          "bronze"

        // Community size = customers with ≥2 orders in 30d
        const communitySize = [...customerOrderCounts.values()].filter(c => c >= 2).length

        // Growth rate: repeat customer orders in last 7d vs prior 7d (7-14d ago)
        const loyalCustomerSet = new Set(loyalEntries.map(([cid]) => cid))
        const repeatOrders7d = rows.filter(
          r => r.customer_id && loyalCustomerSet.has(r.customer_id) && r.created_at >= sevenDaysAgo
        ).length
        const repeatOrdersPrior7d = rows.filter(
          r =>
            r.customer_id &&
            loyalCustomerSet.has(r.customer_id) &&
            r.created_at >= fourteenDaysAgo &&
            r.created_at < sevenDaysAgo
        ).length
        const growthRate7d = repeatOrders7d / Math.max(repeatOrdersPrior7d, 1) - 1

        creatorsScored++

        if (loyalCustomers >= 3 && loyaltyScore >= 30) {
          await emitEvent("loyalty_acceleration", {
            tenantId: creatorId, creatorId, correlationId,
          }, {
            creatorId,
            loyaltyTier,
            loyalCustomers,
            avgOrdersPerLoyalCustomer,
            loyaltyScore,
            snapshotDate: today,
          }, `loyalty_acceleration:${creatorId}:${today}`)
          eventsEmitted++
          signals.push(`loyalty:${creatorId}:${loyaltyTier}:score${loyaltyScore}`)
        }

        if (communitySize >= 5 && growthRate7d > 0.2) {
          const engagementScore = Math.min(100, Math.round(communitySize * 5 + loyaltyScore * 0.5))
          await emitEvent("customer_community_growth", {
            tenantId: creatorId, creatorId, correlationId,
          }, {
            creatorId,
            communitySize,
            growthRate7d,
            engagementScore,
            snapshotDate: today,
          }, `community_growth:${creatorId}:${today}`)
          eventsEmitted++
          signals.push(`community_growth:${creatorId}:size${communitySize}:growth${Math.round(growthRate7d * 100)}pct`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[loyalty-intelligence] engine complete", { creatorsScored, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[loyalty-intelligence] engine failed", { error: String(err) })
  }

  return {
    module: "loyalty-intelligence",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
    creatorsScored,
  }
}
