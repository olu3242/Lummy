/**
 * Marketplace Operations Intelligence Dashboard API
 *
 * Single canonical surface for all marketplace intelligence data.
 * Returns live + persisted data from canonical runtime telemetry.
 * NO fake analytics. NO static arrays.
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
  const today = new Date().toISOString().split("T")[0]
  const sevenDaysAgo  = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]

  try {
    const [
      trustScores,
      creatorRankings,
      marketplaceHealth,
      integritySnapshot,
      expansionOpportunities,
      categoryGrowth,
      geographyExpansion,
      networkAcceleration,
      monetizationOpportunities,
      conversionDrops,
      ecosystemHealth,
      retentionRisk,
      fraudAlerts,
      disputeSpikes,
    ] = await Promise.allSettled([

      // 1. Creator trust scores (top trusted + at-risk)
      admin.from("creator_trust_scores")
        .select("creator_id, trust_score, tier, signals, computed_at")
        .order("trust_score", { ascending: false })
        .limit(20),

      // 2. Creator influence rankings (leaderboard)
      admin.from("creator_rankings")
        .select("creator_id, rank, percentile, tier, composite_score, snapshot_date")
        .gte("snapshot_date", sevenDaysAgo)
        .order("rank", { ascending: true })
        .limit(10),

      // 3. Marketplace health snapshot
      admin.from("marketplace_health_snapshots")
        .select("snapshot_date, overall_score, signals")
        .order("snapshot_date", { ascending: false })
        .limit(7),

      // 4. Marketplace integrity snapshot
      admin.from("marketplace_integrity_snapshots")
        .select("snapshot_date, overall_integrity_score, high_risk_creators, signals")
        .order("snapshot_date", { ascending: false })
        .limit(7),

      // 5. Ecosystem expansion opportunities (recent)
      admin.from("automation_events")
        .select("payload, created_at")
        .eq("event_name", "ecosystem_expansion_opportunity")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5),

      // 6. Category high growth signals
      admin.from("automation_events")
        .select("payload, created_at")
        .eq("event_name", "category_high_growth")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(10),

      // 7. Geography expansion opportunities
      admin.from("automation_events")
        .select("payload, created_at")
        .eq("event_name", "geography_expansion_opportunity")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5),

      // 8. Ecosystem network acceleration signals
      admin.from("automation_events")
        .select("payload, created_at")
        .eq("event_name", "ecosystem_network_acceleration")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(3),

      // 9. Monetization opportunities
      admin.from("automation_events")
        .select("creator_id, payload, created_at")
        .eq("event_name", "creator_monetization_opportunity")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(10),

      // 10. Marketplace conversion drops
      admin.from("automation_events")
        .select("payload, created_at")
        .eq("event_name", "marketplace_conversion_drop")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(3),

      // 11. Ecosystem health snapshots (30d trend)
      admin.from("marketplace_health_snapshots")
        .select("snapshot_date, overall_score, retention_score, conversion_score, growth_score")
        .eq("creator_type", "platform")
        .order("snapshot_date", { ascending: false })
        .limit(30),

      // 12. Ecosystem retention risk events
      admin.from("automation_events")
        .select("payload, created_at")
        .eq("event_name", "ecosystem_retention_risk")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(3),

      // 13. Fraud risk alerts (operational)
      admin.from("automation_events")
        .select("creator_id, payload, created_at")
        .eq("event_name", "customer_fraud_risk")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(10),

      // 14. Dispute spikes
      admin.from("automation_events")
        .select("payload, created_at")
        .eq("event_name", "dispute_spike_detected")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    // Operational alerts: any critical/high priority pending events
    const { data: operationalAlerts } = await admin
      .from("automation_events")
      .select("event_name, creator_id, priority, created_at, status")
      .in("status", ["pending", "retrying", "failed"])
      .lte("priority", 3)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(20)

    return NextResponse.json({
      generatedAt: new Date().toISOString(),

      // Trust + Integrity
      trustScores:          trustScores.status     === "fulfilled" ? trustScores.value.data     : [],
      integrityHistory:     integritySnapshot.status === "fulfilled" ? integritySnapshot.value.data : [],

      // Rankings
      creatorLeaderboard:   creatorRankings.status  === "fulfilled" ? creatorRankings.value.data  : [],

      // Marketplace Health
      marketplaceHealth:    marketplaceHealth.status === "fulfilled" ? marketplaceHealth.value.data : [],
      conversionDrops:      conversionDrops.status   === "fulfilled" ? conversionDrops.value.data   : [],

      // Discovery + Growth
      monetizationOpps:     monetizationOpportunities.status === "fulfilled" ? monetizationOpportunities.value.data : [],

      // Fraud + Safety
      fraudAlerts:          fraudAlerts.status     === "fulfilled" ? fraudAlerts.value.data     : [],
      disputeSpikes:        disputeSpikes.status   === "fulfilled" ? disputeSpikes.value.data   : [],

      // Expansion
      categoryGrowth:       categoryGrowth.status       === "fulfilled" ? categoryGrowth.value.data       : [],
      geographyExpansion:   geographyExpansion.status   === "fulfilled" ? geographyExpansion.value.data   : [],
      expansionOpportunities: expansionOpportunities.status === "fulfilled" ? expansionOpportunities.value.data : [],
      networkAcceleration:  networkAcceleration.status  === "fulfilled" ? networkAcceleration.value.data  : [],

      // Ecosystem
      ecosystemHealth:      ecosystemHealth.status      === "fulfilled" ? ecosystemHealth.value.data      : [],
      retentionRisk:        retentionRisk.status        === "fulfilled" ? retentionRisk.value.data        : [],

      // Operational Alerts
      operationalAlerts:    operationalAlerts ?? [],
    })
  } catch (err) {
    return NextResponse.json({ error: "Marketplace ops intelligence failed", detail: String(err) }, { status: 500 })
  }
}
