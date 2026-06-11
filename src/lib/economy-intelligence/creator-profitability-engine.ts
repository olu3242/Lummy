import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { EconomyIntelligenceRunResult } from "./economy-events"

type OrderRow = { total_amount: number }

function avgAmount(orders: OrderRow[]): number {
  if (orders.length === 0) return 0
  return orders.reduce((s, o) => s + (o.total_amount ?? 0), 0) / orders.length
}

export async function runCreatorProfitabilityEngine(limit = 200): Promise<EconomyIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("profitability")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let creatorsScored = 0

  const now = Date.now()
  const thirtyDaysAgo  = new Date(now - 30 * 86_400_000).toISOString()
  const sixtyDaysAgo   = new Date(now - 60 * 86_400_000).toISOString()

  try {
    const { data: activeCreators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    const creatorIds = (activeCreators ?? []).map((c: { id: string }) => c.id)

    for (const creatorId of creatorIds) {
      try {
        const [currentRes, previousRes] = await Promise.allSettled([
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

        const currentOrders  = currentRes.status  === "fulfilled" ? (currentRes.value.data  ?? []) as OrderRow[] : []
        const previousOrders = previousRes.status === "fulfilled" ? (previousRes.value.data ?? []) as OrderRow[] : []

        const currentAOV  = avgAmount(currentOrders)
        const previousAOV = avgAmount(previousOrders)

        const aovGrowthRate = (currentAOV - previousAOV) / Math.max(previousAOV, 1)

        // 1M kobo (~10k NGN) maps to 100 — reflects healthy per-order revenue relative to platform scale
        const revenueEfficiencyScore = Math.min(100, Math.round(currentAOV / 10_000))

        creatorsScored++

        if (aovGrowthRate >= 0.15 && previousAOV > 0 && currentAOV > 0) {
          await emitEvent(
            "creator_profitability_growth",
            { tenantId: creatorId, creatorId, correlationId },
            { creatorId, currentAOV, previousAOV, aovGrowthRate, revenueEfficiencyScore, snapshotDate: today },
            `profitability_growth:${creatorId}:${today}`,
          )
          eventsEmitted++
          signals.push(`profitability_growth:${creatorId}:aov+${Math.round(aovGrowthRate * 100)}%`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[creator-profitability] engine complete", { creatorsScored, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[creator-profitability] engine failed", { error: String(err) })
  }

  return { module: "creator-profitability", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals, creatorsScored }
}
