import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { RecoveryRunResult } from "./creator-recovery-engine"

export async function runChurnRecoveryEngine(limit = 200): Promise<RecoveryRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("churn-recovery")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  const sevenDaysAgo      = new Date(Date.now() -  7 * 86_400_000).toISOString()
  const twentyFourHrsAgo  = new Date(Date.now() -      86_400_000).toISOString()

  try {
    const { data: retentionRiskEvents } = await supabase
      .from("automation_events")
      .select("creator_id")
      .eq("event_name", "creator_retention_risk")
      .gte("created_at", sevenDaysAgo)
      .limit(limit * 5)

    const uniqueCreatorIds = [...new Set(
      (retentionRiskEvents ?? []).map((r: { creator_id: string }) => r.creator_id).filter(Boolean),
    )].slice(0, 20)

    if (uniqueCreatorIds.length === 0) {
      return { module: "churn-recovery", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals }
    }

    const { data: recentRecoveryEvents } = await supabase
      .from("automation_events")
      .select("creator_id")
      .eq("event_name", "creator_recovery_required")
      .in("creator_id", uniqueCreatorIds)
      .gte("created_at", twentyFourHrsAgo)

    const alreadyTriggered = new Set(
      (recentRecoveryEvents ?? []).map((r: { creator_id: string }) => r.creator_id),
    )

    for (const creatorId of uniqueCreatorIds) {
      try {
        if (alreadyTriggered.has(creatorId)) continue

        await emitEvent(
          "creator_recovery_required",
          { tenantId: creatorId, creatorId, correlationId },
          {
            creatorId,
            recoveryType: "churn_risk",
            recommendedAction: "Re-engage creator with personalized outreach",
            snapshotDate: today,
          },
          `churn_recovery:${creatorId}:${today}`,
        )
        eventsEmitted++
        signals.push(`churn_recovery:${creatorId}`)
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[churn-recovery] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[churn-recovery] engine failed", { error: String(err) })
  }

  return {
    module: "churn-recovery",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
  }
}
