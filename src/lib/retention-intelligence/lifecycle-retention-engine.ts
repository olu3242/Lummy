import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { RetentionIntelligenceRunResult } from "./retention-events"

export async function runLifecycleRetentionEngine(limit = 200): Promise<RetentionIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("lifecycle-retention")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let creatorsScored = 0

  const sevenDaysAgo    = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString()

  try {
    const { data: creators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    for (const creator of (creators ?? []) as { id: string }[]) {
      try {
        const creatorId = creator.id

        let currentViews7d = 0
        let priorViews7d = 0

        const currentRes = await supabase
          .from("storefront_analytics")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", creatorId)
          .gte("created_at", sevenDaysAgo)

        if (!currentRes.error) {
          currentViews7d = currentRes.count ?? 0

          const priorRes = await supabase
            .from("storefront_analytics")
            .select("id", { count: "exact", head: true })
            .eq("creator_id", creatorId)
            .gte("created_at", fourteenDaysAgo)
            .lt("created_at", sevenDaysAgo)

          priorViews7d = priorRes.error ? 0 : (priorRes.count ?? 0)
        }

        // Both remain 0 if storefront_analytics is unavailable — skip rather than emit noise

        const peakViews7d = Math.max(currentViews7d, priorViews7d)
        const decayRate = (currentViews7d - priorViews7d) / Math.max(priorViews7d, 1)

        const decayStage: "early" | "moderate" | "severe" | null =
          decayRate < -0.5  ? "severe" :
          decayRate < -0.25 ? "moderate" :
          decayRate < -0.1  ? "early" :
          null

        creatorsScored++

        if (decayStage !== null && priorViews7d >= 10) {
          await emitEvent("engagement_decay", {
            tenantId: creatorId, creatorId, correlationId,
          }, {
            creatorId,
            peakViews7d,
            currentViews7d,
            decayRate,
            decayStage,
            snapshotDate: today,
          }, `engagement_decay:${creatorId}:${today}`)
          eventsEmitted++
          signals.push(`decay:${creatorId}:${decayStage}:rate${Math.round(decayRate * 100)}pct`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[lifecycle-retention] engine complete", { creatorsScored, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[lifecycle-retention] engine failed", { error: String(err) })
  }

  return {
    module: "lifecycle-retention",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
    creatorsScored,
  }
}
