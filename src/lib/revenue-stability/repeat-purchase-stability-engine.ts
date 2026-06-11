import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { StabilityRunResult } from "./monetization-continuity-engine"

type EconomyScoreRow = {
  creator_id: string
  repeat_purchase_rate: number
  order_velocity: number
  economy_score: number
}

export async function runRepeatPurchaseStabilityEngine(limit = 200): Promise<StabilityRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("repeat-purchase-stability")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  try {
    const { data: rows } = await supabase
      .from("creator_economy_scores")
      .select("creator_id, repeat_purchase_rate, order_velocity, economy_score")
      .gte("computed_at", sevenDaysAgo)
      .limit(limit)

    for (const row of (rows ?? []) as EconomyScoreRow[]) {
      try {
        const { creator_id: creatorId, repeat_purchase_rate, order_velocity, economy_score } = row

        if (repeat_purchase_rate < 0.1 && order_velocity >= 3) {
          await emitEvent(
            "creator_revenue_risk",
            { tenantId: creatorId, creatorId, correlationId },
            {
              creatorId,
              repeatPurchaseRate: repeat_purchase_rate,
              orderVelocity: order_velocity,
              riskType: "low_repeat_purchase",
              snapshotDate: today,
            },
            `repeat_stability:${creatorId}:${today}`,
          )
          eventsEmitted++
          signals.push(`fragile:${creatorId}:velocity=${order_velocity}:repeat=${Math.round(repeat_purchase_rate * 100)}pct`)
        } else if (repeat_purchase_rate > 0.3 && economy_score > 60) {
          await emitEvent(
            "creator_revenue_stabilized",
            { tenantId: creatorId, creatorId, correlationId },
            {
              creatorId,
              repeatPurchaseRate: repeat_purchase_rate,
              economyScore: economy_score,
              snapshotDate: today,
            },
            `repeat_stable:${creatorId}:${today}`,
          )
          eventsEmitted++
          signals.push(`stable:${creatorId}:repeat=${Math.round(repeat_purchase_rate * 100)}pct:economy=${economy_score}`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[repeat-purchase-stability] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[repeat-purchase-stability] engine failed", { error: String(err) })
  }

  return {
    module: "repeat-purchase-stability",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
  }
}
