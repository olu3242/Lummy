/**
 * Expansion Intelligence Engine — orchestrates all marketplace expansion signals
 * into a unified expansion run. Coordinates category, geography, network, and
 * monetization expansion engines.
 *
 * Emits: (delegates to sub-engines)
 */

import { logger } from "@/lib/observability/logger"
import type { ExpansionIntelligenceRunResult } from "./expansion-events"

export async function runExpansionIntelligenceEngine(): Promise<ExpansionIntelligenceRunResult> {
  const start = Date.now()
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const [
      { runCategoryGrowthEngine },
      { runGeographyScalingEngine },
      { runCreatorNetworkScalingEngine },
      { runMonetizationScalingEngine },
    ] = await Promise.all([
      import("./category-growth-engine"),
      import("./geography-scaling-engine"),
      import("./creator-network-scaling-engine"),
      import("./monetization-scaling-engine"),
    ])

    const results = await Promise.allSettled([
      runCategoryGrowthEngine(),
      runGeographyScalingEngine(),
      runCreatorNetworkScalingEngine(),
      runMonetizationScalingEngine(),
    ])

    for (const r of results) {
      if (r.status === "fulfilled") {
        eventsEmitted += r.value.eventsEmitted
        signals.push(...r.value.signals)
      }
    }

    const failures = results.filter(r => r.status === "rejected").length
    logger.info("[expansion-intelligence] orchestration complete", { eventsEmitted, failures })
  } catch (err) {
    logger.error("[expansion-intelligence] orchestration failed", { error: String(err) })
  }

  return { module: "expansion-intelligence", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
