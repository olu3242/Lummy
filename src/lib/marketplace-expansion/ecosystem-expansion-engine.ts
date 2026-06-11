/**
 * Ecosystem Expansion Engine — detects creator acquisition opportunities via
 * network effects and surfaces gaps in ecosystem coverage.
 *
 * Reads from: creator_profiles, creator_performance_snapshots, creator_referrals
 * Emits:      ecosystem_expansion_opportunity (creator_acquisition type)
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ExpansionIntelligenceRunResult } from "./expansion-events"

export async function runEcosystemExpansionEngine(): Promise<ExpansionIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("ecoexp")
  const today = new Date().toISOString().split("T")[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    // Niches with high revenue but few creators = acquisition opportunity
    const [profilesRes, perfRes] = await Promise.allSettled([
      supabase.from("creator_profiles")
        .select("id, niche")
        .eq("is_published", true)
        .not("niche", "is", null)
        .limit(500),
      supabase.from("creator_performance_snapshots")
        .select("creator_id, revenue_kobo, order_count")
        .gte("snapshot_date", thirtyDaysAgo)
        .limit(2000),
    ])

    const profiles = profilesRes.status === "fulfilled"
      ? (profilesRes.value.data ?? []) as { id: string; niche: string }[]
      : []
    const perf = perfRes.status === "fulfilled"
      ? (perfRes.value.data ?? []) as { creator_id: string; revenue_kobo: number; order_count: number }[]
      : []

    const nicheMap = new Map<string, string>(profiles.map(p => [p.id, p.niche]))
    const nicheRevenue = new Map<string, { revenue: number; creators: Set<string> }>()

    for (const p of perf) {
      const niche = nicheMap.get(p.creator_id)
      if (!niche) continue
      const c = nicheRevenue.get(niche) ?? { revenue: 0, creators: new Set() }
      c.revenue += p.revenue_kobo
      c.creators.add(p.creator_id)
      nicheRevenue.set(niche, c)
    }

    // Niches with high revenue but ≤3 creators = creator acquisition opportunity
    const acquisitionOpportunities: string[] = []
    for (const [niche, data] of nicheRevenue.entries()) {
      if (data.revenue >= 50_000_00 && data.creators.size <= 3) {
        acquisitionOpportunities.push(niche)
        signals.push(`acq_opp:${niche}:rev₦${Math.round(data.revenue / 100000)}k:${data.creators.size}creators`)
      }
    }

    if (acquisitionOpportunities.length > 0) {
      await emitEvent("ecosystem_expansion_opportunity", {
        tenantId: "platform", correlationId,
      }, {
        opportunityType:           "creator_acquisition",
        title:                     `${acquisitionOpportunities.length} high-revenue niches underserved`,
        estimatedRevenueImpactKobo: acquisitionOpportunities.length * 100_000_00,
        confidence:                acquisitionOpportunities.length >= 3 ? "high" : "medium",
        actionableCreators:        [],
        snapshotDate:              today,
      }, `eco_expansion:${today}`)
      eventsEmitted++
    }

    logger.info("[ecosystem-expansion] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[ecosystem-expansion] engine failed", { error: String(err) })
  }

  return { module: "ecosystem-expansion", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals }
}
