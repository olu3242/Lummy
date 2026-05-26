import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { RecoveryRunResult } from "./creator-recovery-engine"

export async function runEngagementRecoveryEngine(limit = 200): Promise<RecoveryRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("engagement-recovery")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  try {
    const { data: decayEvents } = await supabase
      .from("automation_events")
      .select("creator_id, payload")
      .eq("event_name", "engagement_decay")
      .gte("created_at", sevenDaysAgo)
      .limit(limit * 5)

    const latestByCreator = new Map<string, { decayStage: string; decayRate: number }>()
    for (const row of (decayEvents ?? []) as { creator_id: string; payload: Record<string, unknown> }[]) {
      if (!row.creator_id || !row.payload) continue
      if (!latestByCreator.has(row.creator_id)) {
        latestByCreator.set(row.creator_id, {
          decayStage: String(row.payload.decayStage ?? ""),
          decayRate:  Number(row.payload.decayRate  ?? 0),
        })
      }
    }

    for (const [creatorId, { decayStage, decayRate }] of latestByCreator) {
      try {
        if (decayStage !== "severe" && decayStage !== "moderate") continue

        await emitEvent(
          "engagement_recovery_required",
          { tenantId: creatorId, creatorId, correlationId },
          {
            creatorId,
            decayStage,
            decayRate,
            recoveryType: "engagement_decay",
            recommendedAction: "Post on social media and share store link",
            snapshotDate: today,
          },
          `engagement_recovery:${creatorId}:${today}`,
        )
        eventsEmitted++
        signals.push(`engagement_recovery:${creatorId}:stage=${decayStage}:rate=${Math.round(decayRate * 100)}pct`)
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[engagement-recovery] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[engagement-recovery] engine failed", { error: String(err) })
  }

  return {
    module: "engagement-recovery",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
  }
}
