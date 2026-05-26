import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"

interface ScalingKernelRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
}

export async function runMarketplaceCapacityEngine(): Promise<ScalingKernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("marketplace-capacity")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const sevenDaysAgo  = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const oneDayAgo     = new Date(Date.now() - 86_400_000).toISOString()
    const eightDaysAgo  = new Date(Date.now() - 8 * 86_400_000).toISOString()

    const { data: activeCreators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)

    const activeCreatorCount = (activeCreators ?? []).length

    const { data: orders7d } = await supabase
      .from("orders")
      .select("id")
      .gte("created_at", sevenDaysAgo)

    const total7dOrders = (orders7d ?? []).length
    const ordersPerCreator7d = total7dOrders / Math.max(activeCreatorCount, 1)

    if (ordersPerCreator7d > 20) {
      await emitEvent(
        "marketplace_capacity_risk",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          activeCreators: activeCreatorCount,
          orders7d: total7dOrders,
          ordersPerCreator: ordersPerCreator7d,
          capacityPressure: "high",
          recommendedAction: "Accelerate creator acquisition",
          snapshotDate: today,
        },
        `marketplace_capacity:platform:${today}`,
      )
      eventsEmitted++
      signals.push(`capacity_pressure:high:creators=${activeCreatorCount}:orders_per_creator=${ordersPerCreator7d.toFixed(1)}`)
    }

    const { data: todayEvents } = await supabase
      .from("automation_events")
      .select("id")
      .gte("created_at", oneDayAgo)

    const { data: priorDayEvents } = await supabase
      .from("automation_events")
      .select("id")
      .gte("created_at", eightDaysAgo)
      .lt("created_at", sevenDaysAgo)

    const todayCount = (todayEvents ?? []).length
    const priorDayCount = (priorDayEvents ?? []).length

    if (priorDayCount > 0 && todayCount > priorDayCount * 1.5) {
      signals.push(`event_volume_spike:today=${todayCount}:prior=${priorDayCount}`)
    }

    logger.info("[marketplace-capacity] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[marketplace-capacity] engine failed", { error: String(err) })
    return { module: "marketplace-capacity", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [String(err)] }
  }

  return { module: "marketplace-capacity", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
