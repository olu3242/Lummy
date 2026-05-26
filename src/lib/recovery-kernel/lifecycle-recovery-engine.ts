import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import { runCreatorRecoveryEngine } from "./creator-recovery-engine"
import { runCustomerRecoveryEngine } from "./customer-recovery-engine"
import { runChurnRecoveryEngine } from "./churn-recovery-engine"
import { runEngagementRecoveryEngine } from "./engagement-recovery-engine"
import { runStorefrontRecoveryEngine } from "./storefront-recovery-engine"
import type { RecoveryRunResult } from "./creator-recovery-engine"

export async function runLifecycleRecoveryEngine(limit = 200): Promise<RecoveryRunResult> {
  const start = Date.now()
  const correlationId = generateCorrelationId("lifecycle-recovery")

  const results = await Promise.allSettled([
    runCreatorRecoveryEngine(limit),
    runCustomerRecoveryEngine(limit),
    runChurnRecoveryEngine(limit),
    runEngagementRecoveryEngine(limit),
    runStorefrontRecoveryEngine(limit),
  ])

  let eventsEmitted = 0
  let alertsRaised  = 0
  const signals: string[] = []

  for (const result of results) {
    if (result.status === "fulfilled") {
      eventsEmitted += result.value.eventsEmitted
      alertsRaised  += result.value.alertsRaised
      signals.push(...result.value.signals)
    } else {
      logger.error("[lifecycle-recovery] sub-engine failed", { error: String(result.reason), correlationId })
      signals.push(`sub_engine_error:${String(result.reason).slice(0, 80)}`)
    }
  }

  logger.info("[lifecycle-recovery] engine complete", { eventsEmitted, alertsRaised, correlationId })

  return {
    module: "lifecycle-recovery",
    eventsEmitted,
    alertsRaised,
    durationMs: Date.now() - start,
    signals,
  }
}
