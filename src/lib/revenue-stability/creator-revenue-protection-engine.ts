import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { StabilityRunResult } from "./monetization-continuity-engine"

type TrustRow    = { creator_id: string; trust_score: number; tier: string }
type EconomyRow  = { creator_id: string; economy_score: number }

export async function runCreatorRevenueProtectionEngine(limit = 200): Promise<StabilityRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("revenue-protection")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const { data: trustRows } = await supabase
      .from("creator_trust_scores")
      .select("creator_id, trust_score, tier")
      .in("tier", ["at_risk", "standard"])
      .limit(limit)

    if (!trustRows || trustRows.length === 0) {
      return { module: "revenue-protection", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals }
    }

    const trustCreatorIds = (trustRows as TrustRow[]).map(r => r.creator_id)

    const { data: economyRows } = await supabase
      .from("creator_economy_scores")
      .select("creator_id, economy_score")
      .in("creator_id", trustCreatorIds)

    const economyMap = new Map<string, number>(
      (economyRows ?? [] as EconomyRow[]).map((r: EconomyRow) => [r.creator_id, r.economy_score]),
    )

    for (const row of trustRows as TrustRow[]) {
      try {
        const { creator_id: creatorId, trust_score: trustScore } = row
        const economyScore = economyMap.get(creatorId) ?? 100

        if (trustScore < 50 && economyScore < 30) {
          await emitEvent(
            "creator_revenue_risk",
            { tenantId: creatorId, creatorId, correlationId },
            {
              creatorId,
              trustScore,
              economyScore,
              riskLevel: "high",
              riskSignals: ["low_trust", "low_economy"],
              snapshotDate: today,
            },
            `revenue_protection:${creatorId}:${today}`,
          )
          eventsEmitted++
          signals.push(`protection_risk:${creatorId}:trust=${trustScore}:economy=${economyScore}`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[revenue-protection] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[revenue-protection] engine failed", { error: String(err) })
  }

  return {
    module: "revenue-protection",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
  }
}
