/**
 * Ecosystem Retention Engine — emits ecosystem_retention_risk when platform
 * creator retention drops below healthy thresholds, and coordinates retention
 * signals from the marketplace retention intelligence.
 *
 * Reads from: marketplace retention engine
 * Emits: ecosystem_retention_risk
 */

import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { EcosystemIntelligenceRunResult } from "./ecosystem-events"

const RETENTION_CRITICAL_THRESHOLD = 60   // < 60% creator retention = critical
const RETENTION_WARNING_THRESHOLD  = 75   // < 75% = warning
const REPEAT_CUSTOMER_MIN          = 20   // < 20% repeat customer rate = flag

export async function runEcosystemRetentionEngine(): Promise<EcosystemIntelligenceRunResult> {
  const start = Date.now()
  const correlationId = generateCorrelationId("eco")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const { runRetentionIntelligenceEngine } = await import("@/lib/marketplace-intelligence/retention-intelligence-engine")
    const result = await runRetentionIntelligenceEngine()
    const summary = result.summary

    const isCritical = summary.overallRetentionRate < RETENTION_CRITICAL_THRESHOLD
    const isWarning  = summary.overallRetentionRate < RETENTION_WARNING_THRESHOLD
    const lowRepeat  = summary.avgRepeatCustomerRate < REPEAT_CUSTOMER_MIN

    if (isCritical || isWarning || lowRepeat) {
      await emitEvent("ecosystem_retention_risk", {
        tenantId: "platform",
        correlationId,
      }, {
        platformRetentionRate:  summary.overallRetentionRate,
        avgRepeatCustomerRate:  summary.avgRepeatCustomerRate,
        churnRiskCreatorCount:  summary.creatorChurnRiskCount,
        criticalThreshold:      isCritical,
        snapshotDate:           today,
      }, `ecosystem_retention_risk:${today}`)

      eventsEmitted++
      alertsRaised++
      signals.push(
        `retention:${summary.overallRetentionRate}%`,
        `repeat_rate:${summary.avgRepeatCustomerRate}%`,
        isCritical ? "CRITICAL" : "WARNING",
      )
    } else {
      signals.push(`retention_healthy:${summary.overallRetentionRate}%`)
    }

    logger.info("[ecosystem-retention] engine complete", {
      retentionRate: summary.overallRetentionRate,
      repeatRate: summary.avgRepeatCustomerRate,
      churnRisk: summary.creatorChurnRiskCount,
      emitted: eventsEmitted,
      correlationId,
    })
  } catch (err) {
    logger.error("[ecosystem-retention] engine failed", { error: String(err) })
  }

  return { module: "ecosystem-retention", eventsEmitted, alertsRaised, durationMs: Date.now() - start, signals }
}
