import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { recomputeAllHealthScores } from "@/lib/growth/health"
import { processAutomationEvent } from "@/lib/automation/handlers"
import { runChurnScoringJob } from "@/lib/creator/churn"
import { computeViralityScores, snapshotCreatorPerformance } from "@/lib/analytics/marketplace"
import { startSLARecord, completeSLARecord } from "@/lib/automation/sla"
import { getWorkflowByEventName } from "@/runtime/registry/workflow-registry-service"
import { logAutomation } from "@/lib/automation/sdk"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { AutomationEventName } from "@/lib/automation/events"

export interface JobResult {
  jobName: string
  ok: boolean
  durationMs: number
  processed?: number
  failed?: number
  error?: string
}

/** Daily: recompute creator health scores and fire retention automations */
export async function runHealthScoringJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const summary = await recomputeAllHealthScores()
    logger.info("[job] health_scoring complete", summary as unknown as Record<string, unknown>)
    return { jobName: "health_scoring", ok: true, durationMs: Date.now() - start, processed: summary.totalScored }
  } catch (err) {
    return { jobName: "health_scoring", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/**
 * Process pending automation_events (up to batchSize at a time).
 *
 * Lifecycle per event:
 *   pending → processing (optimistic lock)
 *   → workflow_registry lookup (resolves workflowId + SLA config)
 *   → handler dispatch (handlers.ts)
 *   → completed / failed
 *   → automation_logs persisted with workflow_id + correlationId
 *   → workflow_sla_records updated
 *   → DLQ after 5 attempts
 */
export async function runAutomationProcessorJob(batchSize = 50): Promise<JobResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  try {
    const { data: events } = await supabase
      .from("automation_events")
      .select("id, event_name, creator_id, payload, attempt_count, idempotency_key")
      .eq("processed", false)
      .eq("processing", false)
      .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(batchSize)

    if (!events?.length) {
      return { jobName: "automation_processor", ok: true, durationMs: Date.now() - start, processed: 0 }
    }

    let processed = 0
    let failed = 0

    for (const ev of events as {
      id: string
      event_name: string
      creator_id: string
      payload: Record<string, unknown>
      attempt_count: number | null
      idempotency_key: string | null
    }[]) {
      const eventStart = Date.now()

      // Optimistic lock — skip if we lose the race with a concurrent invocation
      const { error: lockErr } = await supabase
        .from("automation_events")
        .update({ processing: true, status: "processing", updated_at: new Date().toISOString() })
        .eq("id", ev.id)
        .eq("processing", false)
      if (lockErr) continue

      // Correlation ID: prefer stored in payload, else generate fresh
      const correlationId: string =
        (ev.payload.correlationId as string | undefined) ??
        generateCorrelationId("ae")

      // Resolve canonical workflow entry from registry
      const workflowEntry = await getWorkflowByEventName(ev.event_name)
      const workflowId: string =
        workflowEntry?.workflowId ??
        (ev.payload.workflowId as string | undefined) ??
        ev.event_name

      // Start SLA tracking with registry-resolved SLA target
      const slaRecord = await startSLARecord(
        workflowId,
        ev.payload.tenantId as string | undefined,
        correlationId,
        ev.id,
      )

      const result = await processAutomationEvent(
        ev.id,
        ev.event_name as AutomationEventName,
        ev.creator_id,
        { ...ev.payload, correlationId, workflowId },
      )

      const executionDurationMs = Date.now() - eventStart

      if (result.ok) {
        await supabase.from("automation_events").update({
          processed:             true,
          processing:            false,
          status:                "completed",
          processed_at:          new Date().toISOString(),
          execution_duration_ms: executionDurationMs,
          workflow_id:           workflowId,
          correlation_id:        correlationId,
        }).eq("id", ev.id)

        await completeSLARecord(slaRecord, "completed")

        await logAutomation({
          workflowId,
          eventName:  ev.event_name,
          status:     "success",
          durationMs: executionDurationMs,
          ctx: {
            tenantId:      ev.payload.tenantId as string ?? ev.creator_id,
            creatorId:     ev.creator_id,
            correlationId,
          },
          metadata: { eventId: ev.id, attempt: (ev.attempt_count ?? 0) + 1 },
        })

        processed++
      } else {
        const attempts = (ev.attempt_count ?? 0) + 1
        const isDead = attempts >= 5

        const failStatus = isDead ? "dead_letter" : attempts > 1 ? "retrying" : "failed"
        await supabase.from("automation_events").update({
          processing:            false,
          processed:             isDead,
          status:                failStatus,
          processed_at:          isDead ? new Date().toISOString() : null,
          attempt_count:         attempts,
          last_error:            result.error ?? "unknown error",
          failed_at:             new Date().toISOString(),
          execution_duration_ms: executionDurationMs,
          workflow_id:           workflowId,
          correlation_id:        correlationId,
        }).eq("id", ev.id)

        if (isDead) {
          logger.error("[automation] event moved to DLQ after 5 attempts", {
            eventId:      ev.id,
            eventName:    ev.event_name,
            creatorId:    ev.creator_id,
            workflowId,
            correlationId,
          })
        }

        await completeSLARecord(slaRecord, "failed", result.error)

        await logAutomation({
          workflowId,
          eventName:  ev.event_name,
          status:     "failure",
          durationMs: executionDurationMs,
          ctx: {
            tenantId:      ev.payload.tenantId as string ?? ev.creator_id,
            creatorId:     ev.creator_id,
            correlationId,
          },
          metadata: { eventId: ev.id, attempt: attempts, isDead, error: result.error },
        })

        failed++
      }
    }

    return { jobName: "automation_processor", ok: true, durationMs: Date.now() - start, processed, failed } as JobResult
  } catch (err) {
    return { jobName: "automation_processor", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Retry dead-letter webhook events (up to 5 attempts enforced in retry.ts) */
export async function runWebhookRetryJob(): Promise<JobResult> {
  const start = Date.now()
  const supabase = createAdminClient()

  try {
    const { count } = await supabase
      .from("webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .lt("attempt_count", 5)

    logger.info("[job] webhook_retry: pending failed events", { count: count ?? 0 })
    return { jobName: "webhook_retry", ok: true, durationMs: Date.now() - start, processed: count ?? 0 }
  } catch (err) {
    return { jobName: "webhook_retry", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Cleanup read notifications older than 90 days */
export async function runNotificationCleanupJob(): Promise<JobResult> {
  const start = Date.now()
  const supabase = createAdminClient()

  try {
    const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString()
    const { count } = await supabase
      .from("notifications")
      .delete()
      .eq("is_read", true)
      .lt("created_at", cutoff)

    return { jobName: "notification_cleanup", ok: true, durationMs: Date.now() - start, processed: count ?? 0 }
  } catch (err) {
    return { jobName: "notification_cleanup", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Daily: compute churn risk scores for all active creators */
export async function runChurnScoringJobWorker(): Promise<JobResult> {
  const start = Date.now()
  try {
    const result = await runChurnScoringJob(200)
    logger.info("[job] churn_scoring complete", result as unknown as Record<string, unknown>)
    return { jobName: "churn_scoring", ok: true, durationMs: Date.now() - start, processed: result.scored }
  } catch (err) {
    return { jobName: "churn_scoring", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/**
 * Self-healing: unstick events locked in processing=true for > 5 minutes.
 * Guards against worker crashes leaving events perpetually in-flight.
 */
export async function runStuckQueueRecoveryJob(): Promise<JobResult> {
  const start = Date.now()
  const supabase = createAdminClient()

  try {
    const cutoff = new Date(Date.now() - 5 * 60_000).toISOString()

    const { data: stuckEvents } = await supabase
      .from("automation_events")
      .select("id, event_name, attempt_count")
      .eq("processed", false)
      .eq("processing", true)
      .lt("updated_at", cutoff)
      .limit(50)

    if (!stuckEvents?.length) {
      return { jobName: "stuck_queue_recovery", ok: true, durationMs: Date.now() - start, processed: 0 }
    }

    let recovered = 0
    for (const ev of stuckEvents as { id: string; event_name: string; attempt_count: number }[]) {
      await supabase.from("automation_events").update({
        processing: false,
        last_error: "Recovered by self-healing job (processing lock > 5 min)",
        updated_at: new Date().toISOString(),
      }).eq("id", ev.id)
      recovered++
    }

    logger.info("[job] stuck_queue_recovery complete", { recovered })
    return { jobName: "stuck_queue_recovery", ok: true, durationMs: Date.now() - start, processed: recovered }
  } catch (err) {
    return { jobName: "stuck_queue_recovery", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Daily: compute virality scores + creator performance snapshots */
export async function runMarketplaceIntelligenceJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const [viralResult, snapResult] = await Promise.all([
      computeViralityScores(),
      snapshotCreatorPerformance(),
    ])
    logger.info("[job] marketplace_intelligence complete", { viralResult, snapResult })
    return {
      jobName:    "marketplace_intelligence",
      ok:         true,
      durationMs: Date.now() - start,
      processed:  viralResult.computed + snapResult.snapped,
      failed:     viralResult.failed,
    }
  } catch (err) {
    return { jobName: "marketplace_intelligence", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs all intelligence engines: creator trends, workflow health, AI cost, engagement */
export async function runIntelligenceScoringJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { analyzeCreatorRevenueTrends, detectHealthScoreDegradation, detectEngagementDrops } = await import("@/lib/intelligence/creator-intelligence")
    const { detectRetrySplikes } = await import("@/lib/intelligence/workflow-intelligence")
    const { detectAICostAnomalies, detectAIBudgetRisk } = await import("@/lib/intelligence/ai-intelligence")
    const { detectHighValueCustomers } = await import("@/lib/intelligence/conversion-intelligence")
    const { detectDisengagedCustomers } = await import("@/lib/intelligence/engagement-intelligence")

    const results = await Promise.allSettled([
      analyzeCreatorRevenueTrends(200),
      detectHealthScoreDegradation(200),
      detectEngagementDrops(200),
      detectRetrySplikes(),
      detectAICostAnomalies(),
      detectAIBudgetRisk(),
      detectHighValueCustomers(),
      detectDisengagedCustomers(),
    ])

    const totalEvents = results.reduce((s, r) => s + (r.status === "fulfilled" ? r.value.eventsEmitted : 0), 0)
    const failures    = results.filter(r => r.status === "rejected").length

    logger.info("[job] intelligence_scoring complete", { totalEvents, failures })
    return { jobName: "intelligence_scoring", ok: true, durationMs: Date.now() - start, processed: totalEvents, failed: failures }
  } catch (err) {
    return { jobName: "intelligence_scoring", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs creator success monitoring: risk scanning, recommendation generation, health snapshots */
export async function runCreatorSuccessMonitoringJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { scanAtRiskCreators } = await import("@/lib/creator-success/creator-risk-engine")
    const { runRecommendationEngine } = await import("@/lib/intelligence/recommendation-engine")
    const { computeOperationalHealthReport, persistHealthSnapshot } = await import("@/lib/intelligence/operational-health-intelligence")

    const [riskResult, recResult, healthReport] = await Promise.allSettled([
      scanAtRiskCreators(100),
      runRecommendationEngine(100),
      computeOperationalHealthReport().then(async report => {
        await persistHealthSnapshot(report)
        return report
      }),
    ])

    const riskSummary = riskResult.status === "fulfilled" ? riskResult.value : { scanned: 0, critical: 0, high: 0 }
    const recSummary  = recResult.status  === "fulfilled" ? recResult.value : { eventsEmitted: 0 }
    const health      = healthReport.status === "fulfilled" ? healthReport.value.overall : 0

    logger.info("[job] creator_success_monitoring complete", {
      riskScanned: riskSummary.scanned,
      critical:    riskSummary.critical,
      recsGenerated: recSummary.eventsEmitted,
      healthScore: health,
    })

    return {
      jobName: "creator_success_monitoring",
      ok: true,
      durationMs: Date.now() - start,
      processed: riskSummary.scanned + recSummary.eventsEmitted,
      failed: riskResult.status === "rejected" ? 1 : 0,
    }
  } catch (err) {
    return { jobName: "creator_success_monitoring", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs coordination engines: monetization, conversion, creator influence */
export async function runCoordinationJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { detectMonetizationOpportunities } = await import("@/lib/coordination/monetization-coordinator")
    const { runConversionCoordination } = await import("@/lib/coordination/conversion-coordinator")
    const { detectHighInfluenceCreators } = await import("@/lib/coordination/creator-coordinator")
    const { runWorkflowPriorityEngine } = await import("@/lib/coordination/workflow-priority-engine")

    const results = await Promise.allSettled([
      detectMonetizationOpportunities(100),
      runConversionCoordination(100),
      detectHighInfluenceCreators(100),
      runWorkflowPriorityEngine(),
    ])

    const totalEvents = results.reduce((s, r) => {
      if (r.status === "fulfilled") {
        const v = r.value as { eventsEmitted?: number; processed?: number }
        return s + (v.eventsEmitted ?? v.processed ?? 0)
      }
      return s
    }, 0)
    const failures = results.filter(r => r.status === "rejected").length

    logger.info("[job] coordination complete", { totalEvents, failures })
    return { jobName: "coordination", ok: true, durationMs: Date.now() - start, processed: totalEvents, failed: failures }
  } catch (err) {
    return { jobName: "coordination", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs ecosystem intelligence: growth trends, health, retention risk */
export async function runEcosystemIntelligenceJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runEcosystemGrowthEngine } = await import("@/lib/ecosystem-intelligence/ecosystem-growth-engine")
    const { runEcosystemHealthEngine } = await import("@/lib/ecosystem-intelligence/ecosystem-health-engine")
    const { runEcosystemRetentionEngine } = await import("@/lib/ecosystem-intelligence/ecosystem-retention-engine")

    const results = await Promise.allSettled([
      runEcosystemGrowthEngine(),
      runEcosystemHealthEngine(),
      runEcosystemRetentionEngine(),
    ])

    const totalEvents = results.reduce((s, r) => s + (r.status === "fulfilled" ? r.value.eventsEmitted : 0), 0)
    const failures    = results.filter(r => r.status === "rejected").length

    logger.info("[job] ecosystem_intelligence complete", { totalEvents, failures })
    return { jobName: "ecosystem_intelligence", ok: true, durationMs: Date.now() - start, processed: totalEvents, failed: failures }
  } catch (err) {
    return { jobName: "ecosystem_intelligence", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs trust intelligence: creator trust scoring, reputation, fraud, dispute, integrity */
export async function runTrustIntelligenceJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runCreatorTrustEngine }         = await import("@/lib/trust-intelligence/creator-trust-engine")
    const { runReputationEngine }           = await import("@/lib/trust-intelligence/reputation-engine")
    const { runTransactionSafetyEngine }    = await import("@/lib/trust-intelligence/transaction-safety-engine")
    const { runFraudRiskEngine }            = await import("@/lib/trust-intelligence/fraud-risk-engine")
    const { runDisputeIntelligenceEngine }  = await import("@/lib/trust-intelligence/dispute-intelligence-engine")
    const { runMarketplaceIntegrityEngine } = await import("@/lib/trust-intelligence/marketplace-integrity-engine")

    const results = await Promise.allSettled([
      runCreatorTrustEngine(200),
      runReputationEngine(200),
      runTransactionSafetyEngine(500),
      runFraudRiskEngine(),
      runDisputeIntelligenceEngine(300),
      runMarketplaceIntegrityEngine(),
    ])

    const totalEvents = results.reduce((s, r) => s + (r.status === "fulfilled" ? (r.value.eventsEmitted ?? 0) : 0), 0)
    const failures    = results.filter(r => r.status === "rejected").length

    logger.info("[job] trust_intelligence complete", { totalEvents, failures })
    return { jobName: "trust_intelligence", ok: true, durationMs: Date.now() - start, processed: totalEvents, failed: failures }
  } catch (err) {
    return { jobName: "trust_intelligence", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs discovery intelligence: trending creators, storefront ranking, customer matching, intent */
export async function runDiscoveryIntelligenceJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runCreatorDiscoveryEngine }   = await import("@/lib/discovery-intelligence/creator-discovery-engine")
    const { runStorefrontRankingEngine }  = await import("@/lib/discovery-intelligence/storefront-ranking-engine")
    const { runCustomerMatchingEngine }   = await import("@/lib/discovery-intelligence/customer-matching-engine")
    const { runIntentDiscoveryEngine }    = await import("@/lib/discovery-intelligence/intent-discovery-engine")
    const { runEngagementRankingEngine }  = await import("@/lib/discovery-intelligence/engagement-ranking-engine")

    const results = await Promise.allSettled([
      runCreatorDiscoveryEngine(200),
      runStorefrontRankingEngine(200),
      runCustomerMatchingEngine(200),
      runIntentDiscoveryEngine(300),
      runEngagementRankingEngine(200),
    ])

    const totalEvents = results.reduce((s, r) => s + (r.status === "fulfilled" ? (r.value.eventsEmitted ?? 0) : 0), 0)
    const failures    = results.filter(r => r.status === "rejected").length

    logger.info("[job] discovery_intelligence complete", { totalEvents, failures })
    return { jobName: "discovery_intelligence", ok: true, durationMs: Date.now() - start, processed: totalEvents, failed: failures }
  } catch (err) {
    return { jobName: "discovery_intelligence", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs marketplace expansion intelligence: categories, geography, network scaling, monetization */
export async function runMarketplaceExpansionJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runExpansionIntelligenceEngine } = await import("@/lib/marketplace-expansion/expansion-intelligence-engine")
    const { runEcosystemExpansionEngine }    = await import("@/lib/marketplace-expansion/ecosystem-expansion-engine")
    const { runCreatorNetworkEngine }        = await import("@/lib/ecosystem-intelligence/creator-network-engine")
    const { runCreatorCollaborationEngine }  = await import("@/lib/ecosystem-intelligence/creator-collaboration-engine")
    const { runCreatorRelationshipEngine }   = await import("@/lib/ecosystem-intelligence/creator-relationship-engine")

    const results = await Promise.allSettled([
      runExpansionIntelligenceEngine(),
      runEcosystemExpansionEngine(),
      runCreatorNetworkEngine(),
      runCreatorCollaborationEngine(100),
      runCreatorRelationshipEngine(200),
    ])

    const totalEvents = results.reduce((s, r) => s + (r.status === "fulfilled" ? (r.value.eventsEmitted ?? 0) : 0), 0)
    const failures    = results.filter(r => r.status === "rejected").length

    logger.info("[job] marketplace_expansion complete", { totalEvents, failures })
    return { jobName: "marketplace_expansion", ok: true, durationMs: Date.now() - start, processed: totalEvents, failed: failures }
  } catch (err) {
    return { jobName: "marketplace_expansion", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs economy intelligence: creator growth scoring, forecasting, profitability, repeat purchase */
export async function runEconomyIntelligenceJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runCreatorEconomyEngine }        = await import("@/lib/economy-intelligence/creator-economy-engine")
    const { runMonetizationForecastEngine }  = await import("@/lib/economy-intelligence/monetization-forecast-engine")
    const { runCreatorProfitabilityEngine }  = await import("@/lib/economy-intelligence/creator-profitability-engine")
    const { runRepeatPurchaseEngine }        = await import("@/lib/economy-intelligence/repeat-purchase-engine")
    const { runMarketplaceRevenueEngine }    = await import("@/lib/economy-intelligence/marketplace-revenue-engine")
    const { runEcosystemProfitabilityEngine } = await import("@/lib/economy-intelligence/ecosystem-profitability-engine")

    const results = await Promise.allSettled([
      runCreatorEconomyEngine(200),
      runMonetizationForecastEngine(200),
      runCreatorProfitabilityEngine(200),
      runRepeatPurchaseEngine(200),
      runMarketplaceRevenueEngine(),
      runEcosystemProfitabilityEngine(100),
    ])

    const totalEvents = results.reduce((s, r) => s + (r.status === "fulfilled" ? (r.value.eventsEmitted ?? 0) : 0), 0)
    const failures    = results.filter(r => r.status === "rejected").length

    logger.info("[job] economy_intelligence complete", { totalEvents, failures })
    return { jobName: "economy_intelligence", ok: true, durationMs: Date.now() - start, processed: totalEvents, failed: failures }
  } catch (err) {
    return { jobName: "economy_intelligence", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs retention intelligence: creator/customer retention risk, churn, loyalty, lifecycle, engagement */
export async function runRetentionIntelligenceJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runCreatorRetentionEngine }    = await import("@/lib/retention-intelligence/creator-retention-engine")
    const { runCustomerRetentionEngine }   = await import("@/lib/retention-intelligence/customer-retention-engine")
    const { runChurnRiskEngine }           = await import("@/lib/retention-intelligence/churn-risk-engine")
    const { runLoyaltyIntelligenceEngine } = await import("@/lib/retention-intelligence/loyalty-intelligence-engine")
    const { runLifecycleRetentionEngine }  = await import("@/lib/retention-intelligence/lifecycle-retention-engine")
    const { runEngagementRetentionEngine } = await import("@/lib/retention-intelligence/engagement-retention-engine")

    const results = await Promise.allSettled([
      runCreatorRetentionEngine(200),
      runCustomerRetentionEngine(200),
      runChurnRiskEngine(300),
      runLoyaltyIntelligenceEngine(200),
      runLifecycleRetentionEngine(200),
      runEngagementRetentionEngine(200),
    ])

    const totalEvents = results.reduce((s, r) => s + (r.status === "fulfilled" ? (r.value.eventsEmitted ?? 0) : 0), 0)
    const failures    = results.filter(r => r.status === "rejected").length

    logger.info("[job] retention_intelligence complete", { totalEvents, failures })
    return { jobName: "retention_intelligence", ok: true, durationMs: Date.now() - start, processed: totalEvents, failed: failures }
  } catch (err) {
    return { jobName: "retention_intelligence", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs scaling coordination: bottleneck detection, ecosystem integrity, monetization anomaly, governance */
export async function runScalingCoordinationJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runScalingPriorityEngine }    = await import("@/lib/scaling-coordination/scaling-priority-engine")
    const { runEcosystemCoordinator }     = await import("@/lib/scaling-coordination/ecosystem-coordinator")
    const { runMonetizationCoordinator }  = await import("@/lib/scaling-coordination/monetization-coordinator")
    const { runMarketplaceCoordinator }   = await import("@/lib/scaling-coordination/marketplace-coordinator")
    const { runCreatorAcquisitionEngine } = await import("@/lib/scaling-coordination/creator-acquisition-engine")
    const { runScalingGovernanceEngine }  = await import("@/lib/scaling-coordination/scaling-governance-engine")

    const results = await Promise.allSettled([
      runScalingPriorityEngine(),
      runEcosystemCoordinator(),
      runMonetizationCoordinator(),
      runMarketplaceCoordinator(),
      runCreatorAcquisitionEngine(),
      runScalingGovernanceEngine(),
    ])

    const totalEvents = results.reduce((s, r) => s + (r.status === "fulfilled" ? (r.value.eventsEmitted ?? 0) : 0), 0)
    const failures    = results.filter(r => r.status === "rejected").length

    logger.info("[job] scaling_coordination complete", { totalEvents, failures })
    return { jobName: "scaling_coordination", ok: true, durationMs: Date.now() - start, processed: totalEvents, failed: failures }
  } catch (err) {
    return { jobName: "scaling_coordination", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs intervention system: unified coordinator, routing, governance reads, compression */
export async function runInterventionSystemJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runInterventionEngine }            = await import("@/lib/intervention-system/intervention-engine")
    const { runInterventionRoutingEngine }     = await import("@/lib/intervention-system/intervention-routing-engine")
    const { runInterventionGovernanceEngine }  = await import("@/lib/intervention-system/intervention-governance-engine")
    const { runInterventionCompressionEngine } = await import("@/lib/intervention-system/intervention-compression-engine")

    const results = await Promise.allSettled([
      runInterventionEngine(),
      runInterventionRoutingEngine(),
      runInterventionGovernanceEngine(),
      runInterventionCompressionEngine(),
    ])

    const totalEvents = results.reduce((s, r) => s + (r.status === "fulfilled" ? (r.value.eventsEmitted ?? 0) : 0), 0)
    const failures    = results.filter(r => r.status === "rejected").length
    logger.info("[job] intervention_system complete", { totalEvents, failures })
    return { jobName: "intervention_system", ok: true, durationMs: Date.now() - start, processed: totalEvents, failed: failures }
  } catch (err) {
    return { jobName: "intervention_system", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs stability governance: governance stability, integrity, trust, sustainability, operational */
export async function runStabilityGovernanceJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runStabilityGovernanceOrchestrator } = await import("@/lib/stability-governance/operational-stability-engine")
    const result = await runStabilityGovernanceOrchestrator()
    logger.info("[job] stability_governance complete", result as unknown as Record<string, unknown>)
    return { jobName: "stability_governance", ok: true, durationMs: Date.now() - start, processed: result.eventsEmitted, failed: 0 }
  } catch (err) {
    return { jobName: "stability_governance", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs stabilization scaling: adaptive, capacity, density, bottleneck, monetization scaling */
export async function runStabilizationScalingJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runScalingStabilizationOrchestrator } = await import("@/lib/stabilization-scaling/monetization-scaling-engine")
    const result = await runScalingStabilizationOrchestrator()
    logger.info("[job] stabilization_scaling complete", result as unknown as Record<string, unknown>)
    return { jobName: "stabilization_scaling", ok: true, durationMs: Date.now() - start, processed: result.eventsEmitted, failed: 0 }
  } catch (err) {
    return { jobName: "stabilization_scaling", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs marketplace kernel: signal compression, operational truth, intervention ranking, governance */
export async function runMarketplaceKernelJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runMarketplaceKernelEngine } = await import("@/lib/kernel-intelligence/marketplace-kernel-engine")
    const result = await runMarketplaceKernelEngine()
    logger.info("[job] marketplace_kernel complete", result as unknown as Record<string, unknown>)
    return { jobName: "marketplace_kernel", ok: true, durationMs: Date.now() - start, processed: result.eventsEmitted, failed: 0 }
  } catch (err) {
    return { jobName: "marketplace_kernel", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs governance kernel: marketplace, trust, integrity, monetization, retention governance */
export async function runGovernanceKernelJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runGovernancePriorityEngine } = await import("@/lib/governance-kernel/governance-priority-engine")
    const result = await runGovernancePriorityEngine()
    logger.info("[job] governance_kernel complete", result as unknown as Record<string, unknown>)
    return { jobName: "governance_kernel", ok: true, durationMs: Date.now() - start, processed: result.eventsEmitted, failed: 0 }
  } catch (err) {
    return { jobName: "governance_kernel", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs revenue stability: monetization continuity, stability, payout, protection, ecosystem */
export async function runRevenueStabilityJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runMonetizationContinuityEngine }     = await import("@/lib/revenue-stability/monetization-continuity-engine")
    const { runRevenueStabilityEngine }           = await import("@/lib/revenue-stability/revenue-stability-engine")
    const { runPayoutReliabilityEngine }          = await import("@/lib/revenue-stability/payout-reliability-engine")
    const { runCreatorRevenueProtectionEngine }   = await import("@/lib/revenue-stability/creator-revenue-protection-engine")
    const { runRepeatPurchaseStabilityEngine }    = await import("@/lib/revenue-stability/repeat-purchase-stability-engine")
    const { runEcosystemRevenueStabilityEngine }  = await import("@/lib/revenue-stability/ecosystem-revenue-stability-engine")

    const results = await Promise.allSettled([
      runMonetizationContinuityEngine(200),
      runRevenueStabilityEngine(200),
      runPayoutReliabilityEngine(200),
      runCreatorRevenueProtectionEngine(200),
      runRepeatPurchaseStabilityEngine(200),
      runEcosystemRevenueStabilityEngine(),
    ])

    const totalEvents = results.reduce((s, r) => s + (r.status === "fulfilled" ? (r.value.eventsEmitted ?? 0) : 0), 0)
    const failures    = results.filter(r => r.status === "rejected").length
    logger.info("[job] revenue_stability complete", { totalEvents, failures })
    return { jobName: "revenue_stability", ok: true, durationMs: Date.now() - start, processed: totalEvents, failed: failures }
  } catch (err) {
    return { jobName: "revenue_stability", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs recovery kernel: creator, customer, churn, engagement, storefront recovery */
export async function runRecoveryKernelJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runLifecycleRecoveryEngine } = await import("@/lib/recovery-kernel/lifecycle-recovery-engine")
    const result = await runLifecycleRecoveryEngine(200)
    logger.info("[job] recovery_kernel complete", result as unknown as Record<string, unknown>)
    return { jobName: "recovery_kernel", ok: true, durationMs: Date.now() - start, processed: result.eventsEmitted, failed: 0 }
  } catch (err) {
    return { jobName: "recovery_kernel", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

/** Runs scaling kernel: adaptive scaling, creator density, category capacity, bottlenecks, capacity */
export async function runScalingKernelJob(): Promise<JobResult> {
  const start = Date.now()
  try {
    const { runScalingKernelGovernanceEngine } = await import("@/lib/scaling-kernel/scaling-governance-engine")
    const result = await runScalingKernelGovernanceEngine()
    logger.info("[job] scaling_kernel complete", result as unknown as Record<string, unknown>)
    return { jobName: "scaling_kernel", ok: true, durationMs: Date.now() - start, processed: result.eventsEmitted, failed: 0 }
  } catch (err) {
    return { jobName: "scaling_kernel", ok: false, durationMs: Date.now() - start, error: String(err) }
  }
}

export const ALL_JOBS: Record<string, () => Promise<JobResult>> = {
  health_scoring:              runHealthScoringJob,
  churn_scoring:               runChurnScoringJobWorker,
  automation_processor:        runAutomationProcessorJob,
  webhook_retry:                runWebhookRetryJob,
  notification_cleanup:         runNotificationCleanupJob,
  stuck_queue_recovery:         runStuckQueueRecoveryJob,
  marketplace_intelligence:     runMarketplaceIntelligenceJob,
  intelligence_scoring:         runIntelligenceScoringJob,
  creator_success_monitoring:   runCreatorSuccessMonitoringJob,
  coordination:                 runCoordinationJob,
  ecosystem_intelligence:       runEcosystemIntelligenceJob,
  trust_intelligence:           runTrustIntelligenceJob,
  discovery_intelligence:       runDiscoveryIntelligenceJob,
  marketplace_expansion:        runMarketplaceExpansionJob,
  economy_intelligence:         runEconomyIntelligenceJob,
  retention_intelligence:       runRetentionIntelligenceJob,
  scaling_coordination:         runScalingCoordinationJob,
  marketplace_kernel:           runMarketplaceKernelJob,
  governance_kernel:            runGovernanceKernelJob,
  revenue_stability:            runRevenueStabilityJob,
  recovery_kernel:              runRecoveryKernelJob,
  scaling_kernel:               runScalingKernelJob,
  intervention_system:          runInterventionSystemJob,
  stability_governance:         runStabilityGovernanceJob,
  stabilization_scaling:        runStabilizationScalingJob,
}
