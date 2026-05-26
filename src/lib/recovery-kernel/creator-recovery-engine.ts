import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"

export interface RecoveryRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
}

export async function runCreatorRecoveryEngine(limit = 200): Promise<RecoveryRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("creator-recovery")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  try {
    const { data: creators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    const creatorIds = (creators ?? []).map((c: { id: string }) => c.id)

    const { data: lastOrderRows } = await supabase
      .from("orders")
      .select("creator_id, created_at")
      .in("creator_id", creatorIds)
      .eq("status", "completed")
      .order("created_at", { ascending: false })

    const lastOrderByCreator = new Map<string, string>()
    for (const row of (lastOrderRows ?? []) as { creator_id: string; created_at: string }[]) {
      if (!lastOrderByCreator.has(row.creator_id)) {
        lastOrderByCreator.set(row.creator_id, row.created_at)
      }
    }

    for (const creatorId of creatorIds) {
      try {
        const lastOrderDate = lastOrderByCreator.get(creatorId)

        if (!lastOrderDate) continue

        const daysSinceLastOrder = Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / 86_400_000)

        if (daysSinceLastOrder > 30) {
          await emitEvent(
            "creator_recovery_required",
            { tenantId: creatorId, creatorId, correlationId },
            {
              creatorId,
              daysSinceLastOrder,
              lastOrderDate,
              recoveryType: "revenue_drought",
              recommendedAction: "Share store link and add new products",
              snapshotDate: today,
            },
            `creator_recovery:${creatorId}:${today}`,
          )
          eventsEmitted++
          signals.push(`drought:${creatorId}:days=${daysSinceLastOrder}`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[creator-recovery] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[creator-recovery] engine failed", { error: String(err) })
  }

  return {
    module: "creator-recovery",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
  }
}
