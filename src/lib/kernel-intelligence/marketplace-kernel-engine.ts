import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import { runSignalCompressionEngine } from "./signal-compression-engine"
import { runOperationalTruthEngine } from "./operational-truth-engine"
import { runInterventionRankingEngine } from "./intervention-ranking-engine"
import { runRuntimeGovernanceEngine } from "./runtime-governance-engine"
import { runMarketplaceStateEngine } from "./marketplace-state-engine"
import type { KernelRunResult } from "./kernel-events"

export async function runMarketplaceKernelEngine(): Promise<KernelRunResult> {
  const start = Date.now()
  const correlationId = generateCorrelationId("marketplace-kernel")
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0
  let scoresComputed = 0

  try {
    const phase1Results = await Promise.allSettled([
      runSignalCompressionEngine(),
      runOperationalTruthEngine(),
      runInterventionRankingEngine(),
      runRuntimeGovernanceEngine(),
    ])

    for (const result of phase1Results) {
      if (result.status === "fulfilled") {
        eventsEmitted += result.value.eventsEmitted
        alertsRaised += result.value.alertsRaised
        signals.push(...result.value.signals)
        scoresComputed += result.value.scoresComputed ?? 0
      } else {
        logger.error("[marketplace-kernel] sub-engine failed", { error: String(result.reason) })
        signals.push(`sub_engine_error:${String(result.reason).slice(0, 80)}`)
      }
    }

    const stateResult = await runMarketplaceStateEngine()
    eventsEmitted += stateResult.eventsEmitted
    alertsRaised += stateResult.alertsRaised
    signals.push(...stateResult.signals)

    logger.info("[marketplace-kernel] engine complete", { eventsEmitted, alertsRaised, scoresComputed, correlationId })

    return {
      module: "marketplace-kernel",
      eventsEmitted,
      alertsRaised,
      durationMs: Date.now() - start,
      signals,
      scoresComputed,
    }
  } catch (err) {
    logger.error("[marketplace-kernel] engine failed", { error: String(err) })
    return { module: "marketplace-kernel", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }
}
