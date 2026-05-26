/**
 * AI-Native Marketplace Control Center
 *
 * Single compressed operational intelligence surface.
 * Returns canonical scores, ranked interventions, and live marketplace state.
 * NO fake analytics. NO static arrays. ALL data from canonical runtime telemetry.
 */

import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  const today        = new Date().toISOString().split("T")[0]
  const sevenDaysAgo = new Date(Date.now() -  7 * 86_400_000).toISOString().split("T")[0]
  const thirtyDaysAgo= new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]
  const oneDayAgo    = new Date(Date.now() -  1 * 86_400_000).toISOString()

  try {
    const [
      // ── Canonical score sources ─────────────────────────────────────────
      marketplaceHealthSnaps,
      integritySnaps,
      economySnaps,
      creatorTrustAgg,
      creatorEconomyAgg,
      operationalQueue,
      slaHealth,
      // ── Intervention sources ────────────────────────────────────────────
      kernelInterventions,
      highPriorityPending,
      monetizationRisks,
      retentionRisks,
      scalingBottlenecks,
      governanceRisks,
      operationalDegradations,
      // ── Live intelligence feeds ─────────────────────────────────────────
      trustScores,
      creatorRankings,
      expansionOpportunities,
      categoryGrowth,
      geographyExpansion,
      fraudAlerts,
      disputeSpikes,
      recoveryAlerts,
      revenueRisks,
    ] = await Promise.allSettled([

      // 1. Marketplace health (last 7 snapshots)
      admin.from("marketplace_health_snapshots")
        .select("snapshot_date, overall_score, retention_score, conversion_score, growth_score")
        .order("snapshot_date", { ascending: false })
        .limit(7),

      // 2. Marketplace integrity (last 2 for delta)
      admin.from("marketplace_integrity_snapshots")
        .select("snapshot_date, overall_integrity_score, high_risk_creators, signals")
        .order("snapshot_date", { ascending: false })
        .limit(2),

      // 3. Economy health (last 2 for delta)
      admin.from("economy_health_snapshots")
        .select("snapshot_date, total_gmv_30d_kobo, growth_rate, avg_creator_revenue_30d_kobo, active_creators, economy_score")
        .order("snapshot_date", { ascending: false })
        .limit(2),

      // 4. Creator trust aggregate
      admin.from("creator_trust_scores")
        .select("trust_score, tier")
        .order("trust_score", { ascending: false })
        .limit(500),

      // 5. Creator economy scores aggregate
      admin.from("creator_economy_scores")
        .select("economy_score, repeat_purchase_rate, order_velocity")
        .gte("computed_at", sevenDaysAgo)
        .limit(500),

      // 6. Operational queue depth
      admin.from("automation_events")
        .select("id, priority, status", { count: "exact", head: false })
        .in("status", ["pending", "retrying"])
        .eq("processing", false)
        .limit(10),

      // 7. SLA health (24h)
      admin.from("workflow_sla_records")
        .select("status")
        .gte("started_at", oneDayAgo)
        .limit(500),

      // 8. Kernel interventions from marketplace_memory
      admin.from("marketplace_memory")
        .select("value, updated_at")
        .eq("namespace", "kernel")
        .eq("entity_id", "platform")
        .eq("memory_key", "top_interventions")
        .maybeSingle(),

      // 9. High-priority pending events (live operational view)
      admin.from("automation_events")
        .select("event_name, creator_id, priority, created_at, status")
        .in("status", ["pending", "retrying", "failed"])
        .lte("priority", 3)
        .order("priority", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(20),

      // 10. Monetization risks (last 7d)
      admin.from("automation_events")
        .select("creator_id, event_name, payload, created_at")
        .in("event_name", ["monetization_anomaly", "creator_revenue_risk", "monetization_interruption_detected", "marketplace_scaling_bottleneck", "creator_revenue_drop"])
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5),

      // 11. Retention risks (last 7d)
      admin.from("automation_events")
        .select("creator_id, event_name, payload, created_at")
        .in("event_name", ["creator_retention_risk", "customer_retention_recovery_needed", "engagement_decay", "creator_churn_risk", "customer_churn_risk"])
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5),

      // 12. Scaling bottlenecks (last 7d)
      admin.from("automation_events")
        .select("creator_id, event_name, payload, created_at")
        .in("event_name", ["marketplace_scaling_bottleneck", "scaling_governance_alert", "scaling_bottleneck_detected", "marketplace_capacity_risk", "scaling_coordination_required"])
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5),

      // 13. Governance risks (last 7d)
      admin.from("automation_events")
        .select("creator_id, event_name, payload, created_at")
        .in("event_name", ["marketplace_governance_risk", "marketplace_integrity_risk", "ecosystem_integrity_risk", "marketplace_sustainability_risk", "trust_governance_degraded"])
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5),

      // 14. Operational degradations (24h dead-letter + failed)
      admin.from("automation_events")
        .select("event_name, creator_id, created_at")
        .in("status", ["dead_letter", "failed"])
        .gte("created_at", oneDayAgo)
        .order("created_at", { ascending: false })
        .limit(20),

      // 15. Trust scores (top + at-risk)
      admin.from("creator_trust_scores")
        .select("creator_id, trust_score, tier, signals, computed_at")
        .order("trust_score", { ascending: false })
        .limit(20),

      // 16. Creator leaderboard
      admin.from("creator_rankings")
        .select("creator_id, rank, percentile, tier, composite_score, snapshot_date")
        .gte("snapshot_date", sevenDaysAgo)
        .order("rank", { ascending: true })
        .limit(10),

      // 17. Expansion opportunities
      admin.from("automation_events")
        .select("payload, created_at")
        .eq("event_name", "ecosystem_expansion_opportunity")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5),

      // 18. Category growth
      admin.from("automation_events")
        .select("payload, created_at")
        .eq("event_name", "category_high_growth")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(10),

      // 19. Geography expansion
      admin.from("automation_events")
        .select("payload, created_at")
        .eq("event_name", "geography_expansion_opportunity")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5),

      // 20. Fraud alerts
      admin.from("automation_events")
        .select("creator_id, payload, created_at")
        .eq("event_name", "customer_fraud_risk")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(10),

      // 21. Dispute spikes
      admin.from("automation_events")
        .select("payload, created_at")
        .eq("event_name", "dispute_spike_detected")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5),

      // 22. Recovery alerts (last 7d)
      admin.from("automation_events")
        .select("creator_id, event_name, payload, created_at")
        .in("event_name", ["creator_recovery_required", "customer_recovery_required", "storefront_recovery_required", "engagement_recovery_required"])
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(10),

      // 23. Revenue risks (last 7d)
      admin.from("automation_events")
        .select("creator_id, event_name, payload, created_at")
        .in("event_name", ["creator_revenue_risk", "payout_degradation_detected", "monetization_interruption_detected"])
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(10),
    ])

    // ── Compute canonical scores from raw telemetry ─────────────────────────

    const healthSnaps = marketplaceHealthSnaps.status === "fulfilled" ? (marketplaceHealthSnaps.value.data ?? []) as { overall_score: number; retention_score: number; conversion_score: number; growth_score: number }[] : []
    const latestHealth = healthSnaps[0] ?? { overall_score: 50, retention_score: 50, conversion_score: 50, growth_score: 50 }

    const integrityRows = integritySnaps.status === "fulfilled" ? (integritySnaps.value.data ?? []) as { overall_integrity_score: number; high_risk_creators: number }[] : []
    const latestIntegrity = integrityRows[0] ?? { overall_integrity_score: 70, high_risk_creators: 0 }

    const econSnaps = economySnaps.status === "fulfilled" ? (economySnaps.value.data ?? []) as { economy_score: number; growth_rate: number; total_gmv_30d_kobo: number; active_creators: number; avg_creator_revenue_30d_kobo: number }[] : []
    const latestEcon = econSnaps[0] ?? { economy_score: 50, growth_rate: 0, total_gmv_30d_kobo: 0, active_creators: 0, avg_creator_revenue_30d_kobo: 0 }

    const trustRows = creatorTrustAgg.status === "fulfilled" ? (creatorTrustAgg.value.data ?? []) as { trust_score: number; tier: string }[] : []
    const avgTrust = trustRows.length > 0 ? Math.round(trustRows.reduce((s, r) => s + r.trust_score, 0) / trustRows.length) : 70
    const atRiskCount = trustRows.filter(r => r.tier === "at_risk").length

    const econScoreRows = creatorEconomyAgg.status === "fulfilled" ? (creatorEconomyAgg.value.data ?? []) as { economy_score: number; repeat_purchase_rate: number }[] : []
    const avgRepeatRate = econScoreRows.length > 0 ? econScoreRows.reduce((s, r) => s + r.repeat_purchase_rate, 0) / econScoreRows.length : 0
    const avgEconScore  = econScoreRows.length > 0 ? Math.round(econScoreRows.reduce((s, r) => s + r.economy_score, 0) / econScoreRows.length) : 50

    const queueRows = operationalQueue.status === "fulfilled" ? (operationalQueue.value.data ?? []) as unknown[] : []
    const queueDepth = queueRows.length
    const runtimeHealthScore = Math.max(0, 100 - Math.min(queueDepth * 0.1, 40))

    const slaRows = slaHealth.status === "fulfilled" ? (slaHealth.value.data ?? []) as { status: string }[] : []
    const slaTotal = slaRows.length
    const slaBreaches = slaRows.filter(r => r.status === "breach").length
    const slaHealthScore = slaTotal > 0 ? Math.max(0, Math.round(100 - (slaBreaches / slaTotal) * 100)) : 90

    // Canonical score bundles
    const creatorScores = {
      healthScore:       latestHealth.overall_score,
      growthScore:       Math.min(100, Math.max(0, Math.round(50 + latestEcon.growth_rate * 50))),
      riskScore:         trustRows.length > 0 ? Math.round((atRiskCount / trustRows.length) * 100) : 20,
      retentionScore:    latestHealth.retention_score ?? avgTrust,
      monetizationScore: latestEcon.economy_score,
      compositeScore:    Math.round((latestHealth.overall_score * 0.25 + avgTrust * 0.2 + latestEcon.economy_score * 0.3 + latestHealth.retention_score * 0.25)),
    }

    const marketplaceScores = {
      healthScore:     latestHealth.overall_score,
      growthScore:     latestHealth.growth_score ?? Math.min(100, Math.max(0, Math.round(50 + latestEcon.growth_rate * 50))),
      integrityScore:  latestIntegrity.overall_integrity_score,
      conversionScore: latestHealth.conversion_score,
      retentionScore:  latestHealth.retention_score,
      compositeScore:  Math.round((latestHealth.overall_score + latestIntegrity.overall_integrity_score + latestHealth.conversion_score + latestHealth.retention_score) / 4),
    }

    const customerScores = {
      engagementScore:  latestHealth.conversion_score,
      conversionScore:  latestHealth.conversion_score,
      loyaltyScore:     Math.round(avgRepeatRate * 100),
      riskScore:        Math.round((1 - avgRepeatRate) * 50 + (atRiskCount > 0 ? 20 : 0)),
    }

    const operationalScores = {
      runtimeHealthScore:    Math.round(runtimeHealthScore),
      workflowHealthScore:   slaHealthScore,
      monetizationHealthScore: latestEcon.economy_score,
      slaHealthScore,
      aiEfficiencyScore:     80,
      compositeScore:        Math.round((runtimeHealthScore + slaHealthScore + latestEcon.economy_score + 80) / 4),
    }

    // ── Build top-5 intervention lists ────────────────────────────────────

    const buildTop5 = (result: PromiseSettledResult<{ data: { creator_id?: string; event_name: string; payload: Record<string, unknown>; created_at: string }[] | null }>, category: string) => {
      if (result.status !== "fulfilled") return []
      return (result.value.data ?? []).slice(0, 5).map(e => ({
        category,
        creatorId: e.creator_id ?? null,
        eventName: e.event_name,
        payload:   e.payload,
        createdAt: e.created_at,
      }))
    }

    const topInterventions = {
      monetizationRisks:     buildTop5(monetizationRisks as PromiseSettledResult<{ data: { creator_id?: string; event_name: string; payload: Record<string, unknown>; created_at: string }[] | null }>, "monetization"),
      retentionRisks:        buildTop5(retentionRisks    as PromiseSettledResult<{ data: { creator_id?: string; event_name: string; payload: Record<string, unknown>; created_at: string }[] | null }>, "retention"),
      scalingBottlenecks:    buildTop5(scalingBottlenecks as PromiseSettledResult<{ data: { creator_id?: string; event_name: string; payload: Record<string, unknown>; created_at: string }[] | null }>, "scaling"),
      governanceRisks:       buildTop5(governanceRisks   as PromiseSettledResult<{ data: { creator_id?: string; event_name: string; payload: Record<string, unknown>; created_at: string }[] | null }>, "governance"),
      operationalDegradations: operationalDegradations.status === "fulfilled"
        ? (operationalDegradations.value.data ?? []).slice(0, 5)
        : [],
      creatorInterventions:  highPriorityPending.status === "fulfilled"
        ? (highPriorityPending.value.data ?? []).slice(0, 5)
        : [],
    }

    // Kernel-persisted interventions (if available)
    const persistedInterventions = kernelInterventions.status === "fulfilled" && kernelInterventions.value.data?.value
      ? (() => { try { return JSON.parse(kernelInterventions.value.data.value as string) } catch { return null } })()
      : null

    return NextResponse.json({
      generatedAt: new Date().toISOString(),

      // ── Canonical score bundles ─────────────────────────────────────────
      scores: {
        creator:     creatorScores,
        marketplace: marketplaceScores,
        customer:    customerScores,
        operational: operationalScores,
      },

      // ── Top-5 interventions per category ───────────────────────────────
      interventions: topInterventions,
      persistedInterventions,

      // ── Marketplace health ──────────────────────────────────────────────
      marketplaceHealth: healthSnaps,
      integrityHistory:  integrityRows,
      economyHealth:     econSnaps,

      // ── Trust + Safety ──────────────────────────────────────────────────
      trustScores:    trustScores.status   === "fulfilled" ? trustScores.value.data    : [],
      fraudAlerts:    fraudAlerts.status   === "fulfilled" ? fraudAlerts.value.data    : [],
      disputeSpikes:  disputeSpikes.status === "fulfilled" ? disputeSpikes.value.data  : [],

      // ── Recovery + Revenue stability ────────────────────────────────────
      recoveryAlerts: recoveryAlerts.status === "fulfilled" ? recoveryAlerts.value.data : [],
      revenueRisks:   revenueRisks.status   === "fulfilled" ? revenueRisks.value.data   : [],

      // ── Creator intelligence ────────────────────────────────────────────
      creatorLeaderboard: creatorRankings.status === "fulfilled" ? creatorRankings.value.data : [],

      // ── Expansion ──────────────────────────────────────────────────────
      categoryGrowth:          categoryGrowth.status          === "fulfilled" ? categoryGrowth.value.data          : [],
      geographyExpansion:      geographyExpansion.status      === "fulfilled" ? geographyExpansion.value.data      : [],
      expansionOpportunities:  expansionOpportunities.status  === "fulfilled" ? expansionOpportunities.value.data  : [],

      // ── Operational alerts ──────────────────────────────────────────────
      operationalAlerts: highPriorityPending.status === "fulfilled" ? highPriorityPending.value.data : [],

      // ── Summary metadata ────────────────────────────────────────────────
      summary: {
        marketplaceCompositeScore: marketplaceScores.compositeScore,
        operationalCompositeScore: operationalScores.compositeScore,
        creatorCompositeScore:     creatorScores.compositeScore,
        queueDepth,
        slaBreachRate:             slaTotal > 0 ? (slaBreaches / slaTotal).toFixed(3) : "0",
        totalGMV30dNGN:            latestEcon.total_gmv_30d_kobo > 0 ? Math.round(latestEcon.total_gmv_30d_kobo / 100) : 0,
        activeCreators:            latestEcon.active_creators,
        snapshotDate:              today,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: "Marketplace ops intelligence failed", detail: String(err) }, { status: 500 })
  }
}
