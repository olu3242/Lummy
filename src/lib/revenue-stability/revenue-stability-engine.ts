import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { StabilityRunResult } from "./monetization-continuity-engine"

export async function runRevenueStabilityEngine(limit = 200): Promise<StabilityRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("revenue-stability")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  const now = Date.now()
  const w1Start = new Date(now - 28 * 86_400_000).toISOString()
  const w2Start = new Date(now - 21 * 86_400_000).toISOString()
  const w3Start = new Date(now - 14 * 86_400_000).toISOString()
  const w4Start = new Date(now -  7 * 86_400_000).toISOString()

  try {
    const { data: creators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    for (const creator of (creators ?? []) as { id: string }[]) {
      try {
        const creatorId = creator.id

        const [r1, r2, r3, r4] = await Promise.allSettled([
          supabase
            .from("orders")
            .select("total_amount")
            .eq("creator_id", creatorId)
            .eq("status", "completed")
            .gte("created_at", w1Start)
            .lt("created_at", w2Start),
          supabase
            .from("orders")
            .select("total_amount")
            .eq("creator_id", creatorId)
            .eq("status", "completed")
            .gte("created_at", w2Start)
            .lt("created_at", w3Start),
          supabase
            .from("orders")
            .select("total_amount")
            .eq("creator_id", creatorId)
            .eq("status", "completed")
            .gte("created_at", w3Start)
            .lt("created_at", w4Start),
          supabase
            .from("orders")
            .select("total_amount")
            .eq("creator_id", creatorId)
            .eq("status", "completed")
            .gte("created_at", w4Start),
        ])

        const sum = (res: typeof r1) =>
          res.status === "fulfilled"
            ? (res.value.data ?? []).reduce((s: number, o: { total_amount: number }) => s + (o.total_amount ?? 0), 0)
            : 0

        const w1Revenue = sum(r1)
        const w2Revenue = sum(r2)
        const w3Revenue = sum(r3)
        const w4Revenue = sum(r4)

        const weeks = [w1Revenue, w2Revenue, w3Revenue, w4Revenue]
        const mean = weeks.reduce((a, b) => a + b, 0) / 4
        const variance = weeks.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / 4
        const stdDev = Math.sqrt(variance)
        const volatility = stdDev / Math.max(mean, 1)

        if (w4Revenue < w1Revenue * 0.5 && w1Revenue > 0) {
          const dropRate = (w1Revenue - w4Revenue) / w1Revenue
          await emitEvent(
            "creator_revenue_risk",
            { tenantId: creatorId, creatorId, correlationId },
            {
              creatorId,
              currentWeekRevenue: w4Revenue,
              peakWeekRevenue: w1Revenue,
              dropRate,
              volatilityScore: Math.min(100, Math.round(volatility * 100)),
              snapshotDate: today,
            },
            `revenue_stability:${creatorId}:${today}`,
          )
          eventsEmitted++
          signals.push(`revenue_risk:${creatorId}:drop=${Math.round(dropRate * 100)}pct`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[revenue-stability] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[revenue-stability] engine failed", { error: String(err) })
  }

  return {
    module: "revenue-stability",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
  }
}
