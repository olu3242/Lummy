import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { EconomyIntelligenceRunResult } from "./economy-events"

type OrderRow = { customer_id: string }

function computeRepeatMetrics(orders: OrderRow[]): { repeatRate: number; loyalCount: number } {
  const countByCustomer = orders.reduce<Map<string, number>>((acc, o) => {
    acc.set(o.customer_id, (acc.get(o.customer_id) ?? 0) + 1)
    return acc
  }, new Map())

  const total      = countByCustomer.size
  const repeatCount = [...countByCustomer.values()].filter(n => n >= 2).length
  const loyalCount  = [...countByCustomer.values()].filter(n => n >= 3).length

  return {
    repeatRate: total > 0 ? repeatCount / total : 0,
    loyalCount,
  }
}

export async function runRepeatPurchaseEngine(limit = 200): Promise<EconomyIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("repeat-purchase")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let creatorsScored = 0

  const now = Date.now()
  const thirtyDaysAgo = new Date(now - 30 * 86_400_000).toISOString()
  const sixtyDaysAgo  = new Date(now - 60 * 86_400_000).toISOString()

  try {
    const { data: activeCreators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    const creatorIds = (activeCreators ?? []).map((c: { id: string }) => c.id)

    for (const creatorId of creatorIds) {
      try {
        const [currentRes, priorRes] = await Promise.allSettled([
          supabase
            .from("orders")
            .select("customer_id")
            .eq("creator_id", creatorId)
            .not("status", "in", '("refunded","cancelled")')
            .gte("created_at", thirtyDaysAgo),
          supabase
            .from("orders")
            .select("customer_id")
            .eq("creator_id", creatorId)
            .not("status", "in", '("refunded","cancelled")')
            .gte("created_at", sixtyDaysAgo)
            .lt("created_at", thirtyDaysAgo),
        ])

        const currentOrders = currentRes.status === "fulfilled" ? (currentRes.value.data ?? []) as OrderRow[] : []
        const priorOrders   = priorRes.status   === "fulfilled" ? (priorRes.value.data   ?? []) as OrderRow[] : []

        const { repeatRate: repeatRateCurrent, loyalCount: loyalCustomerCount } = computeRepeatMetrics(currentOrders)
        const { repeatRate: repeatRatePrior } = computeRepeatMetrics(priorOrders)

        const improvement = (repeatRateCurrent - repeatRatePrior) * 100

        creatorsScored++

        if (improvement >= 10 && repeatRateCurrent > 0) {
          await emitEvent(
            "repeat_purchase_accelerated",
            { tenantId: creatorId, creatorId, correlationId },
            { creatorId, repeatRateCurrent, repeatRatePrior, improvement, loyalCustomerCount, snapshotDate: today },
            `repeat_purchase_accelerated:${creatorId}:${today}`,
          )
          eventsEmitted++
          signals.push(`repeat_purchase_accelerated:${creatorId}:+${Math.round(improvement)}pp`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[repeat-purchase] engine complete", { creatorsScored, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[repeat-purchase] engine failed", { error: String(err) })
  }

  return { module: "repeat-purchase", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals, creatorsScored }
}
