import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { EconomyIntelligenceRunResult } from "./economy-events"

type OrderRow = { total_amount: number; creator_id: string }

export async function runMarketplaceRevenueEngine(): Promise<EconomyIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("marketplace-revenue")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  const now = Date.now()
  const thirtyDaysAgo = new Date(now - 30 * 86_400_000).toISOString()
  const sixtyDaysAgo  = new Date(now - 60 * 86_400_000).toISOString()

  try {
    const [currentRes, priorRes] = await Promise.allSettled([
      supabase
        .from("orders")
        .select("total_amount, creator_id")
        .eq("status", "completed")
        .gte("created_at", thirtyDaysAgo),
      supabase
        .from("orders")
        .select("total_amount, creator_id")
        .eq("status", "completed")
        .gte("created_at", sixtyDaysAgo)
        .lt("created_at", thirtyDaysAgo),
    ])

    const current30d = currentRes.status === "fulfilled" ? (currentRes.value.data ?? []) as OrderRow[] : []
    const prior30d   = priorRes.status   === "fulfilled" ? (priorRes.value.data   ?? []) as OrderRow[] : []

    const totalGMV30dKobo      = current30d.reduce((s, o) => s + (o.total_amount ?? 0), 0)
    const totalGMVPrior30dKobo = prior30d.reduce((s, o) => s + (o.total_amount ?? 0), 0)

    const growthRate     = (totalGMV30dKobo - totalGMVPrior30dKobo) / Math.max(totalGMVPrior30dKobo, 1)
    const activeCreators = new Set(current30d.map(o => o.creator_id)).size
    const avgCreatorRevenue30dKobo = totalGMV30dKobo / Math.max(activeCreators, 1)

    // Anchored at 50 so flat growth = neutral health, not failure
    const economyScore = Math.min(100, Math.round(50 + growthRate * 50))

    await emitEvent(
      "economy_health_updated",
      { tenantId: "platform", creatorId: "platform", correlationId },
      { totalGMV30dKobo, growthRate, avgCreatorRevenue30dKobo, activeCreators, economyScore, snapshotDate: today },
      `economy_health:platform:${today}`,
    )
    eventsEmitted++
    signals.push(`economy_health:score=${economyScore}:growth=${Math.round(growthRate * 100)}%`)

    logger.info("[marketplace-revenue] engine complete", { totalGMV30dKobo, activeCreators, economyScore, correlationId })
  } catch (err) {
    logger.error("[marketplace-revenue] engine failed", { error: String(err) })
  }

  return { module: "marketplace-revenue", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals }
}
