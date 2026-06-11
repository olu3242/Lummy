import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import { runAdaptiveScalingEngine } from "./adaptive-scaling-engine"
import { runCreatorDensityEngine } from "./creator-density-engine"
import { runCategoryCapacityEngine } from "./category-capacity-engine"
import { runScalingBottleneckEngine } from "./scaling-bottleneck-engine"
import { runMarketplaceCapacityEngine } from "./marketplace-capacity-engine"

interface ScalingKernelRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
}

export async function runScalingKernelGovernanceEngine(): Promise<ScalingKernelRunResult> {
  const start = Date.now()
  const correlationId = generateCorrelationId("scaling-kernel-governance")
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  const results = await Promise.allSettled([
    runAdaptiveScalingEngine(),
    runCreatorDensityEngine(),
    runCategoryCapacityEngine(),
    runScalingBottleneckEngine(),
    runMarketplaceCapacityEngine(),
  ])

  for (const result of results) {
    if (result.status === "fulfilled") {
      eventsEmitted += result.value.eventsEmitted
      alertsRaised += result.value.alertsRaised
      signals.push(...result.value.signals.map(s => `[${result.value.module}] ${s}`))
    } else {
      logger.error("[scaling-kernel-governance] engine rejected", { error: String(result.reason), correlationId })
      signals.push(`engine_error:${String(result.reason)}`)
    }
  }

  logger.info("[scaling-kernel-governance] orchestration complete", { eventsEmitted, alertsRaised, correlationId })

  return {
    module: "scaling-kernel-governance",
    eventsEmitted,
    alertsRaised,
    durationMs: Date.now() - start,
    signals,
  }
}
