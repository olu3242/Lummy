import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { EconomyIntelligenceRunResult } from "./economy-events"

type ReferralRow = { referrer_id: string }
type OrderRow    = { total_amount: number }

export async function runEcosystemProfitabilityEngine(limit = 100): Promise<EconomyIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("ecosystem")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let creatorsScored = 0

  const now = Date.now()
  const thirtyDaysAgo = new Date(now - 30 * 86_400_000).toISOString()
  const sixtyDaysAgo  = new Date(now - 60 * 86_400_000).toISOString()

  try {
    let currentReferrals: ReferralRow[] = []
    let priorReferrals:   ReferralRow[] = []

    try {
      const [currentRes, priorRes] = await Promise.allSettled([
        supabase
          .from("creator_referrals")
          .select("referrer_id")
          .gte("created_at", thirtyDaysAgo),
        supabase
          .from("creator_referrals")
          .select("referrer_id")
          .gte("created_at", sixtyDaysAgo)
          .lt("created_at", thirtyDaysAgo),
      ])

      currentReferrals = currentRes.status === "fulfilled" ? (currentRes.value.data ?? []) as ReferralRow[] : []
      priorReferrals   = priorRes.status   === "fulfilled" ? (priorRes.value.data   ?? []) as ReferralRow[] : []
    } catch (_err) {
      // creator_referrals table may not have data yet — return 0 events gracefully
      logger.info("[ecosystem] creator_referrals table unavailable, skipping", { correlationId })
      return { module: "ecosystem-profitability", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [], creatorsScored: 0 }
    }

    if (currentReferrals.length === 0) {
      return { module: "ecosystem-profitability", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [], creatorsScored: 0 }
    }

    const currentCountByCreator = currentReferrals.reduce<Map<string, number>>((acc, r) => {
      acc.set(r.referrer_id, (acc.get(r.referrer_id) ?? 0) + 1)
      return acc
    }, new Map())

    const priorCountByCreator = priorReferrals.reduce<Map<string, number>>((acc, r) => {
      acc.set(r.referrer_id, (acc.get(r.referrer_id) ?? 0) + 1)
      return acc
    }, new Map())

    const eligibleCreators = [...currentCountByCreator.entries()]
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)

    for (const [creatorId, referralCount] of eligibleCreators) {
      try {
        const { data: ordersData } = await supabase
          .from("orders")
          .select("total_amount")
          .eq("creator_id", creatorId)
          .gte("created_at", thirtyDaysAgo)
          .not("status", "in", '("refunded","cancelled")')

        const orders = (ordersData ?? []) as OrderRow[]
        const revenueKobo = orders.reduce((s, o) => s + (o.total_amount ?? 0), 0)

        // Revenue requirement ensures we only surface referrers who also convert sales
        if (revenueKobo === 0) continue

        const priorCount = priorCountByCreator.get(creatorId) ?? 0
        const influenceGrowthRate = priorCount > 0
          ? (referralCount - priorCount) / priorCount
          : 0.2 // default for first-seen influencers

        // referralCount * 15 rewards network activity; revenue term caps at 50 to prevent pure-GMV dominance
        const influenceScore = Math.min(
          100,
          Math.round(referralCount * 15 + Math.min(revenueKobo / 100_000, 50)),
        )

        creatorsScored++

        await emitEvent(
          "creator_ecosystem_influence_growth",
          { tenantId: creatorId, creatorId, correlationId },
          {
            creatorId,
            influenceScore,
            influenceGrowthRate,
            networkSize: referralCount,
            referralCount,
            snapshotDate: today,
          },
          `influence_growth:${creatorId}:${today}`,
        )
        eventsEmitted++
        signals.push(`influence_growth:${creatorId}:score=${influenceScore}`)
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[ecosystem] engine complete", { creatorsScored, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[ecosystem] engine failed", { error: String(err) })
  }

  return { module: "ecosystem-profitability", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals, creatorsScored }
}
