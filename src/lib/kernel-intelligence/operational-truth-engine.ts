import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { KernelRunResult, OperationalScoreBundle } from "./kernel-events"

export async function runOperationalTruthEngine(): Promise<KernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("operational-truth")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const now = Date.now()
    const oneDayAgo = new Date(now - 86_400_000).toISOString()
    const sevenDaysAgo = new Date(now - 7 * 86_400_000).toISOString()

    const [
      economySnapshotRes,
      marketplaceHealthRes,
      trustScoresRes,
      atRiskCreatorsRes,
      totalCreatorsRes,
      pendingEventsRes,
      totalEventsRes,
      slaCompletedRes,
      totalSlaRes,
      slaBreachRes,
      lockLeakRes,
    ] = await Promise.allSettled([
      supabase
        .from("economy_health_snapshots")
        .select("economy_score, growth_rate, total_gmv_30d_kobo, avg_creator_revenue_30d_kobo, active_creators")
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("marketplace_health_snapshots")
        .select("overall_score, retention_score, conversion_score, growth_score")
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("creator_trust_scores")
        .select("trust_score")
        .eq("tier", "verified")
        .gte("computed_at", sevenDaysAgo),
      supabase
        .from("creator_economy_scores")
        .select("id", { count: "exact", head: true })
        .lt("economy_score", 30)
        .gte("computed_at", sevenDaysAgo),
      supabase
        .from("creator_profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
      supabase
        .from("automation_events")
        .select("id", { count: "exact", head: true })
        .eq("processed", false)
        .eq("processing", false)
        .neq("status", "dead_letter")
        .neq("status", "suppressed"),
      supabase
        .from("automation_events")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("workflow_sla_records")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("started_at", oneDayAgo),
      supabase
        .from("workflow_sla_records")
        .select("id", { count: "exact", head: true })
        .gte("started_at", oneDayAgo),
      supabase
        .from("workflow_sla_records")
        .select("id", { count: "exact", head: true })
        .eq("status", "breach")
        .gte("started_at", oneDayAgo),
      supabase
        .from("automation_events")
        .select("id", { count: "exact", head: true })
        .eq("processing", true)
        .lt("created_at", new Date(now - 5 * 60_000).toISOString()),
    ])

    const economyRow = economySnapshotRes.status === "fulfilled" ? economySnapshotRes.value.data : null
    const healthRow = marketplaceHealthRes.status === "fulfilled" ? marketplaceHealthRes.value.data : null
    const trustRows = trustScoresRes.status === "fulfilled" ? (trustScoresRes.value.data ?? []) : []
    const atRiskCount = atRiskCreatorsRes.status === "fulfilled" ? (atRiskCreatorsRes.value.count ?? 0) : 0
    const totalCreators = totalCreatorsRes.status === "fulfilled" ? (totalCreatorsRes.value.count ?? 0) : 0
    const pendingEvents = pendingEventsRes.status === "fulfilled" ? (pendingEventsRes.value.count ?? 0) : 0
    const totalEvents = totalEventsRes.status === "fulfilled" ? (totalEventsRes.value.count ?? 1) : 1
    const slaCompleted = slaCompletedRes.status === "fulfilled" ? (slaCompletedRes.value.count ?? 0) : 0
    const totalSla = totalSlaRes.status === "fulfilled" ? (totalSlaRes.value.count ?? 1) : 1
    const slaBreaches = slaBreachRes.status === "fulfilled" ? (slaBreachRes.value.count ?? 0) : 0
    const lockLeaks = lockLeakRes.status === "fulfilled" ? (lockLeakRes.value.count ?? 0) : 0

    const monetizationScore = economyRow ? Math.min(100, Math.round(economyRow.economy_score)) : 50
    const growthScore = economyRow
      ? Math.min(100, Math.max(0, Math.round((economyRow.growth_rate + 1) * 50)))
      : 50

    const healthScore = healthRow ? Math.round(healthRow.overall_score) : 50
    const retentionScore = healthRow ? Math.round(healthRow.retention_score) : 50
    const riskScore = Math.min(100, Math.round((atRiskCount / Math.max(totalCreators, 1)) * 100))

    const avgTrustScore =
      trustRows.length > 0
        ? trustRows.reduce((sum: number, r: { trust_score: number }) => sum + (r.trust_score ?? 0), 0) / trustRows.length
        : 60
    const retentionProxy = Math.round((avgTrustScore / 100) * 100)

    const creatorComposite = Math.round(
      healthScore * 0.3 +
      growthScore * 0.2 +
      (100 - riskScore) * 0.2 +
      retentionProxy * 0.15 +
      monetizationScore * 0.15,
    )

    signals.push(`creator_composite:${creatorComposite}`)

    const integrityRes = await supabase
      .from("marketplace_integrity_snapshots")
      .select("overall_integrity_score")
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .single()

    const integrityScore = integrityRes.data ? Math.round(integrityRes.data.overall_integrity_score) : 50
    const conversionScore = healthRow ? Math.round(healthRow.conversion_score) : 50
    const marketplaceGrowthScore = healthRow ? Math.round(healthRow.growth_score) : 50
    const marketplaceRetentionScore = healthRow ? Math.round(healthRow.retention_score) : 50
    const marketplaceComposite = Math.round(
      (healthScore + marketplaceGrowthScore + integrityScore + conversionScore + marketplaceRetentionScore) / 5,
    )

    signals.push(`marketplace_composite:${marketplaceComposite}`)

    const engagementScore = conversionScore
    const loyaltyScore = economyRow
      ? Math.min(100, Math.round((economyRow.avg_creator_revenue_30d_kobo > 0 ? 60 : 30)))
      : 50
    const customerRiskScore = 100 - marketplaceRetentionScore

    signals.push(`customer_risk:${customerRiskScore}`)

    const runtimeHealthScore = Math.min(
      100,
      Math.max(0, Math.round(100 - (pendingEvents / Math.max(totalEvents, 1)) * 100)),
    )
    const workflowHealthScore = Math.min(100, Math.round((slaCompleted / Math.max(totalSla, 1)) * 100))
    const slaBreachRate = slaBreaches / Math.max(totalSla, 1)
    const slaHealthScore = Math.max(0, Math.round(100 - slaBreachRate * 100))
    const monetizationHealthScore = monetizationScore
    const aiEfficiencyScore = 80

    const operationalComposite = Math.round(
      (runtimeHealthScore + workflowHealthScore + slaHealthScore + monetizationHealthScore + aiEfficiencyScore) / 5,
    )

    const operationalBundle: OperationalScoreBundle = {
      runtimeHealthScore,
      workflowHealthScore,
      monetizationHealthScore,
      slaHealthScore,
      aiEfficiencyScore,
      compositeScore: operationalComposite,
      snapshotDate: today,
    }

    signals.push(`operational_composite:${operationalComposite}`)

    const expiresAt = new Date(now + 25 * 3600_000).toISOString()
    await supabase.from("marketplace_memory").upsert(
      {
        namespace: "kernel",
        entity_id: "platform",
        memory_key: "operational_truth",
        value: JSON.stringify(operationalBundle),
        expires_at: expiresAt,
      },
      { onConflict: "namespace,entity_id,memory_key" },
    )

    if (runtimeHealthScore < 60 || slaHealthScore < 70) {
      await emitEvent(
        "operational_intervention_required",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          runtimeHealthScore,
          slaHealthScore,
          lockLeaks,
          pendingEvents,
          snapshotDate: today,
        },
        `operational_truth:platform:${today}`,
      )
      eventsEmitted++
      signals.push(`operational_alert:runtime=${runtimeHealthScore},sla=${slaHealthScore}`)
    }

    logger.info("[operational-truth] engine complete", { operationalComposite, eventsEmitted, correlationId })

    return {
      module: "operational-truth",
      eventsEmitted,
      alertsRaised: eventsEmitted,
      durationMs: Date.now() - start,
      signals,
      scoresComputed: 4,
    }
  } catch (err) {
    logger.error("[operational-truth] engine failed", { error: String(err) })
    return { module: "operational-truth", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [], scoresComputed: 0 }
  }
}
