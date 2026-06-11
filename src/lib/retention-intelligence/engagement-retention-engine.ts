import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { RetentionIntelligenceRunResult } from "./retention-events"

export async function runEngagementRetentionEngine(limit = 200): Promise<RetentionIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("engagement-retention")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let creatorsScored = 0

  const thirtyDaysAgo  = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const sixtyDaysAgo   = new Date(Date.now() - 60 * 86_400_000).toISOString()

  try {
    const { data: creators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    for (const creator of (creators ?? []) as { id: string }[]) {
      try {
        const creatorId = creator.id

        // Current 30d window
        const { data: currentOrders } = await supabase
          .from("orders")
          .select("customer_id")
          .eq("creator_id", creatorId)
          .gte("created_at", thirtyDaysAgo)

        const currentRows = (currentOrders ?? []) as { customer_id: string }[]

        const currentCustomerCounts = new Map<string, number>()
        for (const row of currentRows) {
          if (!row.customer_id) continue
          currentCustomerCounts.set(row.customer_id, (currentCustomerCounts.get(row.customer_id) ?? 0) + 1)
        }

        const totalCustomers = currentCustomerCounts.size
        const repeatCustomerCount = [...currentCustomerCounts.values()].filter(c => c >= 2).length
        const repeatPurchaseRate = repeatCustomerCount / Math.max(totalCustomers, 1)

        // Prior 30d window (30–60d ago)
        const { data: priorOrders } = await supabase
          .from("orders")
          .select("customer_id")
          .eq("creator_id", creatorId)
          .gte("created_at", sixtyDaysAgo)
          .lt("created_at", thirtyDaysAgo)

        const priorRows = (priorOrders ?? []) as { customer_id: string }[]

        const priorCustomerCounts = new Map<string, number>()
        for (const row of priorRows) {
          if (!row.customer_id) continue
          priorCustomerCounts.set(row.customer_id, (priorCustomerCounts.get(row.customer_id) ?? 0) + 1)
        }

        const priorTotalCustomers = priorCustomerCounts.size
        const priorRepeatCustomerCount = [...priorCustomerCounts.values()].filter(c => c >= 2).length
        const priorRepeatRate = priorRepeatCustomerCount / Math.max(priorTotalCustomers, 1)

        const growthRate = (repeatPurchaseRate - priorRepeatRate) / Math.max(priorRepeatRate, 0.01)

        creatorsScored++

        if (repeatCustomerCount >= 2 && repeatPurchaseRate > 0.25 && growthRate > 0.1) {
          await emitEvent("customer_repeat_purchase_growth", {
            tenantId: creatorId, creatorId, correlationId,
          }, {
            creatorId,
            repeatPurchaseRate,
            repeatCustomerCount,
            growthRate,
            snapshotDate: today,
          }, `repeat_purchase_growth:${creatorId}:${today}`)
          eventsEmitted++
          signals.push(`repeat_growth:${creatorId}:rate${Math.round(repeatPurchaseRate * 100)}pct:growth${Math.round(growthRate * 100)}pct`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[engagement-retention] engine complete", { creatorsScored, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[engagement-retention] engine failed", { error: String(err) })
  }

  return {
    module: "engagement-retention",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
    creatorsScored,
  }
}
