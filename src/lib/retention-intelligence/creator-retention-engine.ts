import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { RetentionIntelligenceRunResult } from "./retention-events"

export async function runCreatorRetentionEngine(limit = 200): Promise<RetentionIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("creator-retention")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let creatorsScored = 0

  try {
    const { data: creators } = await supabase
      .from("creator_profiles")
      .select("id, updated_at")
      .eq("is_published", true)
      .limit(limit)

    for (const creator of (creators ?? []) as { id: string; updated_at: string }[]) {
      try {
        const creatorId = creator.id

        const { data: lastOrderRow } = await supabase
          .from("orders")
          .select("created_at")
          .eq("creator_id", creatorId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        const now = Date.now()

        const daysSinceLastOrder = lastOrderRow?.created_at
          ? Math.floor((now - new Date(lastOrderRow.created_at).getTime()) / 86_400_000)
          : 90

        const daysSinceLastActivity = Math.floor(
          (now - new Date(creator.updated_at).getTime()) / 86_400_000
        )

        const retentionScore = Math.max(0, 100 - daysSinceLastOrder * 2)

        const riskLevel: "low" | "medium" | "high" | "critical" =
          retentionScore < 20 ? "critical" :
          retentionScore < 40 ? "high" :
          retentionScore < 60 ? "medium" :
          "low"

        const primaryDecaySignal =
          daysSinceLastOrder > 60 ? "no_recent_orders" :
          daysSinceLastOrder > 30 ? "order_drought" :
          daysSinceLastOrder > 14 ? "slowing_orders" :
          "active"

        creatorsScored++

        if (riskLevel === "high" || riskLevel === "critical") {
          await emitEvent("creator_retention_risk", {
            tenantId: creatorId, creatorId, correlationId,
          }, {
            creatorId,
            riskLevel,
            daysSinceLastOrder,
            daysSinceLastActivity,
            retentionScore,
            primaryDecaySignal,
            snapshotDate: today,
          }, `creator_retention_risk:${creatorId}:${today}`)
          eventsEmitted++
          signals.push(`retention_risk:${creatorId}:${riskLevel}:score${retentionScore}`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[creator-retention] engine complete", { creatorsScored, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[creator-retention] engine failed", { error: String(err) })
  }

  return {
    module: "creator-retention",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
    creatorsScored,
  }
}
