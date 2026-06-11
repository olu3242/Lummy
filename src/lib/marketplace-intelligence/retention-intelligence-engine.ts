/**
 * Retention Intelligence Engine — cohort-based retention analysis across
 * the marketplace. Identifies creator cohorts with low repeat customer rates
 * and surfaces retention risk signals.
 *
 * Reads from: creator_metrics_daily, orders
 * Emits: (signals fed back to ecosystem-retention-engine for event emission)
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import type { MarketplaceIntelligenceRunResult } from "./marketplace-events"

export interface RetentionCohortReport {
  cohortMonth: string           // "2025-10"
  totalCreators: number
  activeCreators: number        // still made a sale this month
  retentionRate: number         // 0-1
  avgRepeatCustomerRate: number // 0-1
  topRetentionCreators: string[]
  atRiskCreators: string[]
}

export interface PlatformRetentionSummary {
  overallRetentionRate: number  // 0-100 (% of creators active last month still active this month)
  avgRepeatCustomerRate: number // 0-100
  creatorChurnRiskCount: number
  cohorts: RetentionCohortReport[]
}

// ── Cohort Retention Analysis ─────────────────────────────────────────────────

export async function analyzeCreatorRetentionCohorts(months = 3): Promise<PlatformRetentionSummary> {
  const supabase = createAdminClient()

  const currentMonth = new Date().toISOString().slice(0, 7)
  const cohorts: RetentionCohortReport[] = []
  let totalActiveThisMonth = 0
  let totalActiveLastMonth = 0
  let repeatRateSum = 0
  let repeatRateCount = 0
  let churnRiskCount = 0

  for (let m = 1; m <= months; m++) {
    const monthStart = new Date(Date.now() - m * 30 * 86_400_000)
    const cohortMonth = monthStart.toISOString().slice(0, 7)
    const monthStartStr = `${cohortMonth}-01`
    const monthEndDate = new Date(monthStart)
    monthEndDate.setMonth(monthEndDate.getMonth() + 1)
    const monthEndStr = monthEndDate.toISOString().split("T")[0]

    const { data: cohortMetrics } = await supabase
      .from("creator_metrics_daily")
      .select("creator_id, orders_created, new_customers")
      .gte("date", monthStartStr)
      .lt("date", monthEndStr)

    const creatorRows = new Map<string, { orders: number; newCustomers: number }>()
    for (const row of (cohortMetrics ?? []) as { creator_id: string; orders_created: number; new_customers: number }[]) {
      const c = creatorRows.get(row.creator_id) ?? { orders: 0, newCustomers: 0 }
      c.orders      += row.orders_created
      c.newCustomers += row.new_customers
      creatorRows.set(row.creator_id, c)
    }

    const activeInCohort = [...creatorRows.entries()].filter(([, v]) => v.orders >= 1)
    const topRetention: string[] = []
    const atRisk: string[] = []

    let cohortRepeatSum = 0
    for (const [creatorId, c] of activeInCohort) {
      const repeatRate = c.orders > 0 ? (c.orders - c.newCustomers) / c.orders : 0
      cohortRepeatSum += repeatRate
      if (repeatRate >= 0.4) topRetention.push(creatorId)
      if (repeatRate < 0.1 && c.orders >= 3) {
        atRisk.push(creatorId)
        churnRiskCount++
      }
    }

    const avgRepeat = activeInCohort.length > 0 ? cohortRepeatSum / activeInCohort.length : 0
    repeatRateSum += avgRepeat
    repeatRateCount++

    if (m === 1) totalActiveLastMonth = activeInCohort.length
    if (cohortMonth === currentMonth) totalActiveThisMonth = activeInCohort.length

    cohorts.push({
      cohortMonth,
      totalCreators:        creatorRows.size,
      activeCreators:       activeInCohort.length,
      retentionRate:        creatorRows.size > 0 ? activeInCohort.length / creatorRows.size : 0,
      avgRepeatCustomerRate: avgRepeat,
      topRetentionCreators: topRetention.slice(0, 5),
      atRiskCreators:       atRisk.slice(0, 10),
    })
  }

  const overallRetentionRate = totalActiveLastMonth > 0
    ? Math.round((totalActiveThisMonth / totalActiveLastMonth) * 100)
    : 100

  const avgRepeatCustomerRate = repeatRateCount > 0
    ? Math.round((repeatRateSum / repeatRateCount) * 100)
    : 0

  return {
    overallRetentionRate,
    avgRepeatCustomerRate,
    creatorChurnRiskCount: churnRiskCount,
    cohorts,
  }
}

// ── Retention Intelligence Run ────────────────────────────────────────────────

export async function runRetentionIntelligenceEngine(): Promise<MarketplaceIntelligenceRunResult & { summary: PlatformRetentionSummary }> {
  const start = Date.now()
  const signals: string[] = []

  try {
    const summary = await analyzeCreatorRetentionCohorts(3)

    if (summary.overallRetentionRate < 60) signals.push(`low_platform_retention:${summary.overallRetentionRate}%`)
    if (summary.avgRepeatCustomerRate < 15) signals.push("low_repeat_customer_rate")
    if (summary.creatorChurnRiskCount > 20) signals.push(`high_churn_risk_count:${summary.creatorChurnRiskCount}`)

    logger.info("[retention-intelligence] analysis complete", {
      overallRetention: summary.overallRetentionRate,
      avgRepeat: summary.avgRepeatCustomerRate,
      churnRisk: summary.creatorChurnRiskCount,
    })

    return {
      module: "retention-intelligence",
      eventsEmitted: 0,
      alertsRaised: summary.creatorChurnRiskCount,
      durationMs: Date.now() - start,
      signals,
      summary,
    }
  } catch (err) {
    logger.error("[retention-intelligence] engine failed", { error: String(err) })
    const emptySummary: PlatformRetentionSummary = {
      overallRetentionRate: 0, avgRepeatCustomerRate: 0, creatorChurnRiskCount: 0, cohorts: []
    }
    return { module: "retention-intelligence", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [], summary: emptySummary }
  }
}
