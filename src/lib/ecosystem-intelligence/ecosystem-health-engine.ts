/**
 * Ecosystem Health Engine — platform-wide composite health computed from
 * revenue, growth, retention, and conversion sub-scores.
 *
 * Reads from: marketplace-intelligence sub-engines
 * Writes to: marketplace_health_snapshots (reuses the table; platform-level row)
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import type { EcosystemHealthReport, EcosystemIntelligenceRunResult } from "./ecosystem-events"

export async function computeEcosystemHealthReport(): Promise<EcosystemHealthReport> {
  // Import lazily to avoid circular deps
  const [{ computeMarketplaceHealthScore }, { analyzeCreatorRetentionCohorts }, { analyzeConversionBottlenecks }] = await Promise.all([
    import("@/lib/marketplace-intelligence/marketplace-health-engine"),
    import("@/lib/marketplace-intelligence/retention-intelligence-engine"),
    import("@/lib/marketplace-intelligence/conversion-acceleration-engine"),
  ])

  const [healthResult, retentionResult, conversionResult] = await Promise.allSettled([
    computeMarketplaceHealthScore(),
    analyzeCreatorRetentionCohorts(1),
    analyzeConversionBottlenecks(),
  ])

  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []

  // Revenue + activity sub-score (0-25)
  const marketHealth = healthResult.status === "fulfilled" ? healthResult.value : null
  const revenueScore = marketHealth
    ? Math.round((marketHealth.components.revenueGrowth + marketHealth.components.creatorActivity) / 2 * 25 / 20)
    : 12

  // Growth score (0-25) — based on active creator activity
  const growthScore = marketHealth
    ? Math.round((marketHealth.components.creatorActivity / 20) * 25)
    : 12

  // Retention score (0-25)
  const retention = retentionResult.status === "fulfilled" ? retentionResult.value : null
  const retentionScore = retention
    ? Math.round((retention.overallRetentionRate / 100) * 25)
    : 12

  // Conversion score (0-25)
  const conversion = conversionResult.status === "fulfilled" ? conversionResult.value : null
  const conversionScore = conversion
    ? Math.round((conversion.platformConversionScore / 100) * 25)
    : 12

  const overallScore = revenueScore + growthScore + retentionScore + conversionScore

  if (overallScore >= 70)  signals.push("healthy_ecosystem")
  if (overallScore < 40)   signals.push("ecosystem_at_risk")
  if (retentionScore < 12) signals.push("retention_concern")
  if (conversionScore < 10) signals.push("conversion_concern")
  if (marketHealth && marketHealth.signals.length > 0) signals.push(...marketHealth.signals)

  return { overallScore, revenueScore, growthScore, retentionScore, conversionScore, signals, snapshotDate: today }
}

export async function persistEcosystemHealthSnapshot(report: EcosystemHealthReport): Promise<void> {
  const supabase = createAdminClient()
  try {
    await supabase.from("marketplace_health_snapshots").upsert({
      snapshot_date:       report.snapshotDate,
      overall_score:       report.overallScore,
      revenue_score:       report.revenueScore,
      growth_score:        report.growthScore,
      retention_score:     report.retentionScore,
      conversion_score:    report.conversionScore,
      signals:             report.signals,
      creator_type:        "platform",
    }, { onConflict: "snapshot_date,creator_type" })
  } catch (err) {
    logger.error("[ecosystem-health] failed to persist snapshot", { error: String(err) })
  }
}

export async function runEcosystemHealthEngine(): Promise<EcosystemIntelligenceRunResult & { report: EcosystemHealthReport }> {
  const start = Date.now()

  try {
    const report = await computeEcosystemHealthReport()
    await persistEcosystemHealthSnapshot(report)

    logger.info("[ecosystem-health] engine complete", {
      overallScore: report.overallScore,
      signals: report.signals,
    })

    return {
      module: "ecosystem-health",
      eventsEmitted: 0,
      alertsRaised: report.signals.filter(s => s.includes("risk") || s.includes("concern")).length,
      durationMs: Date.now() - start,
      signals: report.signals,
      report,
    }
  } catch (err) {
    logger.error("[ecosystem-health] engine failed", { error: String(err) })
    const emptyReport: EcosystemHealthReport = {
      overallScore: 0, revenueScore: 0, growthScore: 0, retentionScore: 0,
      conversionScore: 0, signals: [], snapshotDate: new Date().toISOString().split("T")[0],
    }
    return { module: "ecosystem-health", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [], report: emptyReport }
  }
}
