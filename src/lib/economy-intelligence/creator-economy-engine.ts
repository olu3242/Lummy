import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { EconomyIntelligenceRunResult } from "./economy-events"

type OrderRow = { id: string; total_amount: number; customer_id: string; created_at: string; status: string }

export async function runCreatorEconomyEngine(limit = 200): Promise<EconomyIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("economy")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let creatorsScored = 0

  const now = Date.now()
  const sevenDaysAgo    = new Date(now - 7  * 86_400_000).toISOString()
  const fourteenDaysAgo = new Date(now - 14 * 86_400_000).toISOString()
  const thirtyDaysAgo   = new Date(now - 30 * 86_400_000).toISOString()

  try {
    const { data: activeCreators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    const creatorIds = (activeCreators ?? []).map((c: { id: string }) => c.id)

    for (const creatorId of creatorIds) {
      try {
        const [current7dRes, prior7dRes, orders30dRes] = await Promise.allSettled([
          supabase
            .from("orders")
            .select("id, total_amount, customer_id, created_at, status")
            .eq("creator_id", creatorId)
            .gte("created_at", sevenDaysAgo)
            .not("status", "in", '("refunded","cancelled")'),
          supabase
            .from("orders")
            .select("id, total_amount, customer_id, created_at, status")
            .eq("creator_id", creatorId)
            .gte("created_at", fourteenDaysAgo)
            .lt("created_at", sevenDaysAgo)
            .not("status", "in", '("refunded","cancelled")'),
          supabase
            .from("orders")
            .select("id, total_amount, customer_id, created_at, status")
            .eq("creator_id", creatorId)
            .gte("created_at", thirtyDaysAgo)
            .not("status", "in", '("refunded","cancelled")'),
        ])

        const current7dOrders = current7dRes.status === "fulfilled"
          ? (current7dRes.value.data ?? []) as OrderRow[]
          : []
        const prior7dOrders = prior7dRes.status === "fulfilled"
          ? (prior7dRes.value.data ?? []) as OrderRow[]
          : []
        const orders30d = orders30dRes.status === "fulfilled"
          ? (orders30dRes.value.data ?? []) as OrderRow[]
          : []

        const current7dRevenue    = current7dOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0)
        const prior7dRevenue      = prior7dOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0)
        const current7dOrderCount = current7dOrders.length

        const revenueGrowthRate = (current7dRevenue - prior7dRevenue) / Math.max(prior7dRevenue, 1)
        const avgOrderValue     = current7dRevenue / Math.max(current7dOrderCount, 1)
        const orderVelocity     = current7dOrderCount

        const uniqueCustomers30d    = new Set(orders30d.map(o => o.customer_id))
        const repeatCustomers30d    = orders30d.reduce<Map<string, number>>((acc, o) => {
          acc.set(o.customer_id, (acc.get(o.customer_id) ?? 0) + 1)
          return acc
        }, new Map())
        const repeatCount           = [...repeatCustomers30d.values()].filter(n => n >= 2).length
        const repeatPurchaseRate    = uniqueCustomers30d.size > 0 ? repeatCount / uniqueCustomers30d.size : 0

        const economyScore = Math.min(
          100,
          Math.round(revenueGrowthRate * 30 + repeatPurchaseRate * 40 + Math.min(orderVelocity, 10) * 3),
        )

        creatorsScored++

        if (revenueGrowthRate >= 0.35 && current7dRevenue > 0) {
          await emitEvent(
            "creator_high_growth",
            { tenantId: creatorId, creatorId, correlationId },
            { creatorId, growthRate: revenueGrowthRate, period: "7d", revenueKobo: current7dRevenue, orderCount: current7dOrderCount, snapshotDate: today },
            `high_growth:${creatorId}:${today}`,
          )
          eventsEmitted++
          signals.push(`high_growth:${creatorId}:${Math.round(revenueGrowthRate * 100)}%`)
        }

        if (revenueGrowthRate >= 0.20 && prior7dRevenue > 0) {
          const driverSignal: "repeat_buyers" | "volume_spike" | "new_traffic" =
            repeatPurchaseRate > 0.3          ? "repeat_buyers" :
            current7dOrderCount > prior7dOrders.length * 1.5 ? "volume_spike" :
            "new_traffic"

          await emitEvent(
            "creator_revenue_accelerated",
            { tenantId: creatorId, creatorId, correlationId },
            { creatorId, previousRevenueKobo: prior7dRevenue, currentRevenueKobo: current7dRevenue, accelerationRate: revenueGrowthRate, driverSignal, snapshotDate: today },
            `revenue_accelerated:${creatorId}:${today}`,
          )
          eventsEmitted++
          signals.push(`revenue_accelerated:${creatorId}:${driverSignal}`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[creator-economy] engine complete", { creatorsScored, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[creator-economy] engine failed", { error: String(err) })
  }

  return { module: "creator-economy", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals, creatorsScored }
}
