import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import { runMarketplaceGovernanceEngine } from "./marketplace-governance-engine"
import { runTrustGovernanceEngine } from "./trust-governance-engine"
import { runIntegrityGovernanceEngine } from "./integrity-governance-engine"
import { runMonetizationGovernanceEngine } from "./monetization-governance-engine"
import { runRetentionGovernanceEngine } from "./retention-governance-engine"
import type { KernelRunResult } from "@/lib/kernel-intelligence/kernel-events"

export async function runGovernancePriorityEngine(): Promise<KernelRunResult> {
  const start = Date.now()
  const correlationId = generateCorrelationId("governance-priority")
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const results = await Promise.allSettled([
      runMarketplaceGovernanceEngine(),
      runTrustGovernanceEngine(),
      runIntegrityGovernanceEngine(),
      runMonetizationGovernanceEngine(),
      runRetentionGovernanceEngine(),
    ])

    for (const result of results) {
      if (result.status === "fulfilled") {
        eventsEmitted += result.value.eventsEmitted
        alertsRaised += result.value.alertsRaised
        signals.push(...result.value.signals)
      } else {
        logger.error("[governance-priority] sub-engine failed", { error: String(result.reason) })
        signals.push(`sub_engine_error:${String(result.reason).slice(0, 80)}`)
      }
    }

    logger.info("[governance-priority] engine complete", { eventsEmitted, alertsRaised, correlationId })

    return {
      module: "governance-priority",
      eventsEmitted,
      alertsRaised,
      durationMs: Date.now() - start,
      signals,
    }
  } catch (err) {
    logger.error("[governance-priority] engine failed", { error: String(err) })
    return { module: "governance-priority", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }
}
