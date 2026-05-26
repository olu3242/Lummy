import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { KernelRunResult, InterventionItem } from "./kernel-events"

type EventRow = {
  id: string
  event_name: string
  creator_id: string | null
  payload: Record<string, unknown> | null
  status: string
  created_at: string
}

export async function runInterventionRankingEngine(): Promise<KernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("intervention-ranking")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString()

    const allInterventions: InterventionItem[] = []

    const [trustScoresRes, economyScoresRes] = await Promise.allSettled([
      supabase
        .from("creator_trust_scores")
        .select("creator_id, trust_score, tier")
        .lt("trust_score", 40),
      supabase
        .from("creator_economy_scores")
        .select("creator_id, economy_score")
        .lt("economy_score", 20)
        .gte("computed_at", sevenDaysAgo),
    ])

    const lowTrustCreators = trustScoresRes.status === "fulfilled" ? (trustScoresRes.value.data ?? []) : []
    const lowEconomyCreators = economyScoresRes.status === "fulfilled" ? (economyScoresRes.value.data ?? []) : []

    type TrustRow = { creator_id: string; trust_score: number; tier: string }
    type EconRow = { creator_id: string; economy_score: number }

    const creatorInterventions: InterventionItem[] = []
    for (const c of lowTrustCreators as TrustRow[]) {
      creatorInterventions.push({
        category: "creator",
        creatorId: c.creator_id,
        title: "Trust recovery required",
        urgency: "critical",
        score: 100 - c.trust_score,
        signal: `trust_score:${c.trust_score}`,
        recommendedAction: "Review fulfillment and disputes",
        snapshotDate: today,
      })
    }
    for (const c of lowEconomyCreators as EconRow[]) {
      if (!creatorInterventions.find(i => i.creatorId === c.creator_id)) {
        creatorInterventions.push({
          category: "creator",
          creatorId: c.creator_id,
          title: "Economy score critically low",
          urgency: "high",
          score: 80 - c.economy_score,
          signal: `economy_score:${c.economy_score}`,
          recommendedAction: "Review creator revenue and product catalog",
          snapshotDate: today,
        })
      }
    }
    creatorInterventions.sort((a, b) => b.score - a.score)
    allInterventions.push(...creatorInterventions.slice(0, 5))

    if (creatorInterventions.some(i => i.urgency === "critical")) {
      await emitEvent(
        "intervention_priority_high",
        { tenantId: "platform", creatorId: "platform", correlationId },
        { criticalCount: creatorInterventions.filter(i => i.urgency === "critical").length, snapshotDate: today },
        `intervention_priority_high:platform:${today}`,
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`critical_creators:${creatorInterventions.filter(i => i.urgency === "critical").length}`)
    }

    const monetizationEventNames = [
      "monetization_anomaly",
      "creator_revenue_risk",
      "marketplace_scaling_bottleneck",
      "creator_revenue_drop",
    ]
    const { data: monetizationEvents } = await supabase
      .from("automation_events")
      .select("id, event_name, creator_id, payload, status, created_at")
      .in("event_name", monetizationEventNames)
      .gte("created_at", sevenDaysAgo)

    const monetizationInterventions: InterventionItem[] = ((monetizationEvents ?? []) as EventRow[])
      .slice(0, 5)
      .map(e => ({
        category: "monetization" as const,
        creatorId: e.creator_id ?? undefined,
        title: `Monetization risk: ${e.event_name}`,
        urgency: "high" as const,
        score: typeof e.payload?.severity === "number" ? e.payload.severity : 70,
        signal: e.event_name,
        recommendedAction: "Review revenue patterns and payment flows",
        snapshotDate: today,
      }))
    allInterventions.push(...monetizationInterventions)

    if (monetizationInterventions.length >= 2) {
      await emitEvent(
        "monetization_intervention_required",
        { tenantId: "platform", creatorId: "platform", correlationId },
        { riskCount: monetizationInterventions.length, snapshotDate: today },
        `monetization_intervention:platform:${today}`,
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`monetization_risks:${monetizationInterventions.length}`)
    }

    const retentionEventNames = [
      "creator_retention_risk",
      "customer_retention_recovery_needed",
      "engagement_decay",
      "creator_churn_risk",
    ]
    const { data: retentionEvents } = await supabase
      .from("automation_events")
      .select("id, event_name, creator_id, payload, status, created_at")
      .in("event_name", retentionEventNames)
      .gte("created_at", sevenDaysAgo)

    const retentionInterventions: InterventionItem[] = ((retentionEvents ?? []) as EventRow[])
      .slice(0, 5)
      .map(e => ({
        category: "retention" as const,
        creatorId: e.creator_id ?? undefined,
        title: `Retention risk: ${e.event_name}`,
        urgency: "high" as const,
        score: typeof e.payload?.severity === "number" ? e.payload.severity : 65,
        signal: e.event_name,
        recommendedAction: "Activate re-engagement workflows",
        snapshotDate: today,
      }))
    allInterventions.push(...retentionInterventions)

    if (retentionInterventions.length >= 2) {
      await emitEvent(
        "retention_intervention_required",
        { tenantId: "platform", creatorId: "platform", correlationId },
        { riskCount: retentionInterventions.length, snapshotDate: today },
        `retention_intervention:platform:${today}`,
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`retention_risks:${retentionInterventions.length}`)
    }

    const governanceEventNames = [
      "marketplace_governance_risk",
      "marketplace_integrity_risk",
      "scaling_governance_alert",
      "ecosystem_integrity_risk",
    ]
    const { data: governanceEvents } = await supabase
      .from("automation_events")
      .select("id, event_name, creator_id, payload, status, created_at")
      .in("event_name", governanceEventNames)
      .gte("created_at", sevenDaysAgo)

    const governanceInterventions: InterventionItem[] = ((governanceEvents ?? []) as EventRow[])
      .slice(0, 5)
      .map(e => ({
        category: "governance" as const,
        creatorId: e.creator_id ?? undefined,
        title: `Governance risk: ${e.event_name}`,
        urgency: "high" as const,
        score: typeof e.payload?.severity === "number" ? e.payload.severity : 75,
        signal: e.event_name,
        recommendedAction: "Review marketplace policies and creator compliance",
        snapshotDate: today,
      }))
    allInterventions.push(...governanceInterventions)

    if (governanceInterventions.length >= 1) {
      await emitEvent(
        "governance_intervention_required",
        { tenantId: "platform", creatorId: "platform", correlationId },
        { riskCount: governanceInterventions.length, snapshotDate: today },
        `governance_intervention:platform:${today}`,
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`governance_risks:${governanceInterventions.length}`)
    }

    const scalingEventNames = [
      "marketplace_scaling_bottleneck",
      "scaling_bottleneck_detected",
      "marketplace_capacity_risk",
    ]
    const { data: scalingEvents } = await supabase
      .from("automation_events")
      .select("id, event_name, creator_id, payload, status, created_at")
      .in("event_name", scalingEventNames)
      .gte("created_at", sevenDaysAgo)

    const scalingInterventions: InterventionItem[] = ((scalingEvents ?? []) as EventRow[])
      .slice(0, 5)
      .map(e => ({
        category: "scaling" as const,
        creatorId: e.creator_id ?? undefined,
        title: `Scaling bottleneck: ${e.event_name}`,
        urgency: "medium" as const,
        score: typeof e.payload?.severity === "number" ? e.payload.severity : 60,
        signal: e.event_name,
        recommendedAction: "Review infrastructure capacity and creator onboarding rate",
        snapshotDate: today,
      }))
    allInterventions.push(...scalingInterventions)

    if (scalingInterventions.length >= 1) {
      await emitEvent(
        "scaling_intervention_required",
        { tenantId: "platform", creatorId: "platform", correlationId },
        { bottleneckCount: scalingInterventions.length, snapshotDate: today },
        `scaling_intervention:platform:${today}`,
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`scaling_bottlenecks:${scalingInterventions.length}`)
    }

    const { data: failedEvents } = await supabase
      .from("automation_events")
      .select("id, event_name, status")
      .in("status", ["dead_letter", "failed"])
      .gte("created_at", oneDayAgo)

    const failedByName = new Map<string, number>()
    for (const e of (failedEvents ?? []) as { id: string; event_name: string; status: string }[]) {
      failedByName.set(e.event_name, (failedByName.get(e.event_name) ?? 0) + 1)
    }
    const topFailed = [...failedByName.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const operationalInterventions: InterventionItem[] = topFailed.map(([name, count]) => ({
      category: "operational" as const,
      title: `Operational degradation: ${name} (${count} failures)`,
      urgency: count > 20 ? "critical" as const : "high" as const,
      score: Math.min(100, count * 3),
      signal: `failed_event:${name}`,
      recommendedAction: "Investigate and replay failed events",
      snapshotDate: today,
    }))
    allInterventions.push(...operationalInterventions)

    const totalFailures = failedEvents?.length ?? 0
    if (totalFailures > 10) {
      await emitEvent(
        "operational_intervention_required",
        { tenantId: "platform", creatorId: "platform", correlationId },
        { failureCount: totalFailures, topFailedEvents: topFailed.map(([n]) => n), snapshotDate: today },
        `operational_intervention_failures:platform:${today}`,
      )
      eventsEmitted++
      alertsRaised++
      signals.push(`operational_failures:${totalFailures}`)
    }

    allInterventions.sort((a, b) => b.score - a.score)

    await supabase.from("marketplace_memory").upsert(
      {
        namespace: "kernel",
        entity_id: "platform",
        memory_key: "top_interventions",
        value: JSON.stringify(allInterventions.slice(0, 30)),
        expires_at: new Date(Date.now() + 25 * 3600_000).toISOString(),
      },
      { onConflict: "namespace,entity_id,memory_key" },
    )

    logger.info("[intervention-ranking] engine complete", { totalInterventions: allInterventions.length, eventsEmitted, correlationId })

    return {
      module: "intervention-ranking",
      eventsEmitted,
      alertsRaised,
      durationMs: Date.now() - start,
      signals,
    }
  } catch (err) {
    logger.error("[intervention-ranking] engine failed", { error: String(err) })
    return { module: "intervention-ranking", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }
}
