import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"

export interface StabilityRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
}

export async function runMonetizationContinuityEngine(limit = 200): Promise<StabilityRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("monetization-continuity")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  const now = Date.now()
  const thirtyDaysAgo  = new Date(now - 30 * 86_400_000).toISOString()
  const sixtyDaysAgo   = new Date(now - 60 * 86_400_000).toISOString()

  try {
    const { data: creators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    for (const creator of (creators ?? []) as { id: string }[]) {
      try {
        const creatorId = creator.id

        const [current30dRes, prior30dRes] = await Promise.allSettled([
          supabase
            .from("orders")
            .select("total_amount")
            .eq("creator_id", creatorId)
            .eq("status", "completed")
            .gte("created_at", thirtyDaysAgo),
          supabase
            .from("orders")
            .select("total_amount")
            .eq("creator_id", creatorId)
            .eq("status", "completed")
            .gte("created_at", sixtyDaysAgo)
            .lt("created_at", thirtyDaysAgo),
        ])

        const current30dRevenue = current30dRes.status === "fulfilled"
          ? (current30dRes.value.data ?? []).reduce((s: number, o: { total_amount: number }) => s + (o.total_amount ?? 0), 0)
          : 0

        const prior30dRevenue = prior30dRes.status === "fulfilled"
          ? (prior30dRes.value.data ?? []).reduce((s: number, o: { total_amount: number }) => s + (o.total_amount ?? 0), 0)
          : 0

        if (prior30dRevenue > 0 && current30dRevenue === 0) {
          await emitEvent(
            "monetization_interruption_detected",
            { tenantId: creatorId, creatorId, correlationId },
            {
              creatorId,
              previousRevenue30dKobo: prior30dRevenue,
              currentRevenue30dKobo: 0,
              interruptionDays: 30,
              snapshotDate: today,
            },
            `monetization_interruption:${creatorId}:${today}`,
          )
          eventsEmitted++
          signals.push(`interruption:${creatorId}:prior=${prior30dRevenue}`)
        } else if (current30dRevenue > 0 && prior30dRevenue > 0 && current30dRevenue > prior30dRevenue * 1.2) {
          await emitEvent(
            "creator_revenue_stabilized",
            { tenantId: creatorId, creatorId, correlationId },
            {
              creatorId,
              previousRevenue30dKobo: prior30dRevenue,
              currentRevenue30dKobo: current30dRevenue,
              snapshotDate: today,
            },
            `revenue_stabilized:${creatorId}:${today}`,
          )
          eventsEmitted++
          signals.push(`stabilized:${creatorId}:growth=${Math.round((current30dRevenue / prior30dRevenue - 1) * 100)}pct`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[monetization-continuity] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[monetization-continuity] engine failed", { error: String(err) })
  }

  return {
    module: "monetization-continuity",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
  }
}
