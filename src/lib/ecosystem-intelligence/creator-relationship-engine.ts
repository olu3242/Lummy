/**
 * Creator Relationship Engine — tracks relationship strength between creators
 * and their top customers, surfacing loyalty acceleration opportunities.
 *
 * Reads from: orders, creator_metrics_daily
 * Emits:      creator_referral_opportunity, ecosystem_monetization_opportunity
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { EcosystemIntelligenceRunResult } from "./ecosystem-events"

export interface RelationshipStrength {
  creatorId: string
  customerId: string
  orderCount: number
  totalSpendKobo: number
  relationshipScore: number   // 0-100
  tier: "occasional" | "regular" | "loyal" | "champion"
}

export async function runCreatorRelationshipEngine(limit = 200): Promise<EcosystemIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("rel")
  const today = new Date().toISOString().split("T")[0]
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000).toISOString()
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const { data: orders } = await supabase
      .from("orders")
      .select("creator_id, customer_id, status, amount_kobo")
      .eq("status", "completed")
      .gte("created_at", ninetyDaysAgo)
      .not("customer_id", "is", null)
      .limit(limit * 10)

    // Aggregate per creator-customer pair
    const pairMap = new Map<string, { orders: number; spend: number }>()
    for (const o of (orders ?? []) as { creator_id: string; customer_id: string; amount_kobo?: number }[]) {
      const key = `${o.creator_id}::${o.customer_id}`
      const c = pairMap.get(key) ?? { orders: 0, spend: 0 }
      c.orders++
      c.spend += o.amount_kobo ?? 0
      pairMap.set(key, c)
    }

    // Find creators eligible for referral program (have champion customers)
    const creatorChampions = new Map<string, number>()
    for (const [key, stats] of pairMap.entries()) {
      const [creatorId, customerId] = key.split("::")
      const score = Math.min(100, stats.orders * 15 + Math.round(stats.spend / 100_000))
      const tier: RelationshipStrength["tier"] =
        score >= 75 ? "champion" :
        score >= 50 ? "loyal" :
        score >= 25 ? "regular" :
        "occasional"

      if (tier === "champion" || tier === "loyal") {
        creatorChampions.set(creatorId, (creatorChampions.get(creatorId) ?? 0) + 1)
      }

      // Track signals per pair
      if (tier === "champion") {
        signals.push(`champion:${creatorId}:${customerId}:score${score}`)
      }
    }

    // Emit referral opportunity for creators with multiple loyal/champion customers
    for (const [creatorId, championCount] of creatorChampions.entries()) {
      if (championCount >= 2) {
        const potential = championCount >= 5 ? "high" : championCount >= 3 ? "medium" : "low"

        await emitEvent("creator_referral_opportunity", {
          tenantId: creatorId, creatorId, correlationId,
        }, {
          creatorId,
          referralPotential:         potential,
          estimatedReferrals:        Math.round(championCount * 1.5),
          incentiveRecommendation:   "Offer your loyal customers a 10% discount for each referral they bring",
          snapshotDate:              today,
        }, `referral_opp:${creatorId}:${today}`)
        eventsEmitted++
        signals.push(`referral_opp:${creatorId}:${championCount}champions`)
      }
    }

    // Ecosystem monetization opportunity: platform has strong loyal customer base
    const totalChampions = [...creatorChampions.values()].reduce((s, v) => s + v, 0)
    if (totalChampions >= 10) {
      await emitEvent("ecosystem_monetization_opportunity", {
        tenantId: "platform", correlationId,
      }, {
        opportunityType:        "referral_incentive",
        affectedCreators:       creatorChampions.size,
        estimatedRevenueKobo:   totalChampions * 300_000,  // ₦3000 per referral
        confidence:             totalChampions >= 50 ? "high" : "medium",
        snapshotDate:           today,
      }, `ecosystem_monetization:${today}`)
      eventsEmitted++
    }

    logger.info("[creator-relationship] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[creator-relationship] engine failed", { error: String(err) })
  }

  return { module: "creator-relationship", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals }
}
