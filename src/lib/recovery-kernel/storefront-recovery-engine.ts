import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { RecoveryRunResult } from "./creator-recovery-engine"

export async function runStorefrontRecoveryEngine(limit = 200): Promise<RecoveryRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("storefront-recovery")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000).toISOString()

  try {
    const { data: staleProfiles } = await supabase
      .from("creator_profiles")
      .select("id, updated_at")
      .eq("is_published", true)
      .lt("updated_at", sixtyDaysAgo)
      .limit(Math.min(limit, 30))

    if (!staleProfiles || staleProfiles.length === 0) {
      return { module: "storefront-recovery", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals }
    }

    const staleIds = (staleProfiles as { id: string; updated_at: string }[]).map(p => p.id)

    const { data: recentOrderRows } = await supabase
      .from("orders")
      .select("creator_id")
      .in("creator_id", staleIds)
      .eq("status", "completed")
      .gte("created_at", sixtyDaysAgo)

    const hasRecentOrder = new Set(
      (recentOrderRows ?? []).map((r: { creator_id: string }) => r.creator_id),
    )

    const { data: anyOrderRows } = await supabase
      .from("orders")
      .select("creator_id")
      .in("creator_id", staleIds)
      .limit(staleIds.length * 10)

    const hasPriorOrder = new Set(
      (anyOrderRows ?? []).map((r: { creator_id: string }) => r.creator_id),
    )

    for (const profile of staleProfiles as { id: string; updated_at: string }[]) {
      try {
        const creatorId = profile.id

        if (hasRecentOrder.has(creatorId) || !hasPriorOrder.has(creatorId)) continue

        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(profile.updated_at).getTime()) / 86_400_000,
        )

        await emitEvent(
          "storefront_recovery_required",
          { tenantId: creatorId, creatorId, correlationId },
          {
            creatorId,
            daysSinceUpdate,
            recoveryType: "storefront_stale",
            recommendedAction: "Update store: add products, refresh photos, post CTA",
            snapshotDate: today,
          },
          `storefront_recovery:${creatorId}:${today}`,
        )
        eventsEmitted++
        signals.push(`stale:${creatorId}:days=${daysSinceUpdate}`)
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[storefront-recovery] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[storefront-recovery] engine failed", { error: String(err) })
  }

  return {
    module: "storefront-recovery",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
  }
}
