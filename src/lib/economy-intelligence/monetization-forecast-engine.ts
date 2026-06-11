import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { EconomyIntelligenceRunResult } from "./economy-events"

type OrderRow = { id: string; total_amount: number; created_at: string }

export async function runMonetizationForecastEngine(limit = 200): Promise<EconomyIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("forecast")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let creatorsScored = 0

  const now = Date.now()
  const thirtyDaysAgo = new Date(now - 30 * 86_400_000).toISOString()
  const bucket1Start  = new Date(now - 30 * 86_400_000).toISOString()
  const bucket1End    = new Date(now - 20 * 86_400_000).toISOString()
  const bucket2Start  = bucket1End
  const bucket2End    = new Date(now - 10 * 86_400_000).toISOString()
  const bucket3Start  = bucket2End
  const bucket3End    = new Date(now).toISOString()

  try {
    const { data: activeCreators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    const creatorIds = (activeCreators ?? []).map((c: { id: string }) => c.id)

    for (const creatorId of creatorIds) {
      try {
        const { data: orders30d } = await supabase
          .from("orders")
          .select("id, total_amount, created_at")
          .eq("creator_id", creatorId)
          .gte("created_at", thirtyDaysAgo)
          .not("status", "in", '("refunded","cancelled")')

        const rows = (orders30d ?? []) as OrderRow[]

        const bucket1Revenue = rows
          .filter(o => o.created_at >= bucket1Start && o.created_at < bucket1End)
          .reduce((s, o) => s + (o.total_amount ?? 0), 0)
        const bucket2Revenue = rows
          .filter(o => o.created_at >= bucket2Start && o.created_at < bucket2End)
          .reduce((s, o) => s + (o.total_amount ?? 0), 0)
        const bucket3Revenue = rows
          .filter(o => o.created_at >= bucket3Start && o.created_at < bucket3End)
          .reduce((s, o) => s + (o.total_amount ?? 0), 0)

        const currentRevenue30d = rows.reduce((s, o) => s + (o.total_amount ?? 0), 0)

        const trend = (bucket3Revenue - bucket1Revenue) / Math.max(bucket1Revenue, 1)

        // Dampened projection avoids runaway forecasts from single-bucket spikes
        const forecastRevenue30d = bucket3Revenue * (1 + trend * 0.5)

        creatorsScored++

        if (forecastRevenue30d > currentRevenue30d * 1.30 && currentRevenue30d > 0) {
          const scalingSignal: "trajectory_high" | "undermonetized" | "high_traffic_low_revenue" =
            trend > 0.5                   ? "trajectory_high" :
            currentRevenue30d < 5_000_000 ? "undermonetized" :
            "high_traffic_low_revenue"

          const opportunityScore = Math.min(100, Math.round(trend * 50 + 50))

          await emitEvent(
            "creator_scaling_opportunity",
            { tenantId: creatorId, creatorId, correlationId },
            {
              creatorId,
              forecastRevenue30dKobo: Math.round(forecastRevenue30d),
              currentRevenue30dKobo: currentRevenue30d,
              scalingSignal,
              opportunityScore,
              snapshotDate: today,
            },
            `scaling_opportunity:${creatorId}:${today}`,
          )
          eventsEmitted++
          signals.push(`scaling_opportunity:${creatorId}:${scalingSignal}`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[monetization-forecast] engine complete", { creatorsScored, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[monetization-forecast] engine failed", { error: String(err) })
  }

  return { module: "monetization-forecast", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals, creatorsScored }
}
