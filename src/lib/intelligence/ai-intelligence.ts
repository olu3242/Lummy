/**
 * AI Operational Intelligence — cost anomaly detection, latency anomalies,
 * budget forecasting, ROI scoring, usage attribution.
 *
 * Reads from: ai_cost_events, ai_usage_budgets, automation_logs
 * Emits: ai_cost_spike, ai_budget_risk
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { emitEvent } from "@/lib/automation/sdk"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { IntelligenceRunResult } from "./intelligence-events"

const COST_SPIKE_MULTIPLIER = 3.0   // 3× baseline = spike
const BUDGET_RISK_THRESHOLD = 0.75  // >75% of budget = risk alert

// ── AI Cost Anomaly Detection ─────────────────────────────────────────────────

export async function detectAICostAnomalies(): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("ai")
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    const today = new Date().toISOString().split("T")[0]

    // Compare last 1hr vs previous 23hrs per org
    const oneHourAgo    = new Date(Date.now() - 60 * 60_000).toISOString()
    const twentyFourHAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString()

    const { data: recent } = await supabase
      .from("ai_cost_events")
      .select("organization_id, cost_usd, created_at")
      .gte("created_at", twentyFourHAgo)
      .order("created_at", { ascending: false })
      .limit(5000)

    if (!recent?.length) {
      return { module: "ai-intelligence", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
    }

    const byOrg = new Map<string, { currentHour: number; baseline: number }>()
    for (const row of recent as { organization_id: string | null; cost_usd: number; created_at: string }[]) {
      const orgId = row.organization_id ?? "global"
      const c = byOrg.get(orgId) ?? { currentHour: 0, baseline: 0 }
      if (row.created_at >= oneHourAgo) c.currentHour += Number(row.cost_usd)
      else c.baseline += Number(row.cost_usd) / 23  // normalize to hourly rate
      byOrg.set(orgId, c)
    }

    for (const [orgId, { currentHour, baseline }] of byOrg.entries()) {
      if (baseline === 0 || currentHour < 0.001) continue
      const multiplier = currentHour / baseline

      if (multiplier > COST_SPIKE_MULTIPLIER) {
        await emitEvent("ai_cost_spike", { tenantId: orgId, correlationId }, {
          organizationId:    orgId,
          costUsd:           currentHour,
          windowHours:       1,
          baselineCostUsd:   baseline,
          spikeMultiplier:   multiplier,
        }, `ai_cost_spike:${orgId}:${today}`)
        signals.push(`cost_spike:${orgId}:${multiplier.toFixed(1)}x`)
        eventsEmitted++
      }
    }
  } catch (err) {
    logger.error("[ai-intelligence] cost anomaly detection failed", { error: String(err) })
  }

  return { module: "ai-intelligence-cost", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}

// ── AI Budget Risk Detection ──────────────────────────────────────────────────

export async function detectAIBudgetRisk(): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("ai")
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    const today = new Date().toISOString().split("T")[0]
    const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

    const { data: budgets } = await supabase
      .from("ai_usage_budgets")
      .select("organization_id, budget_usd, used_usd, alert_threshold, hard_cap")
      .eq("period_start", periodStart)
      .limit(500)

    for (const b of (budgets ?? []) as { organization_id: string | null; budget_usd: number; used_usd: number; alert_threshold: number; hard_cap: boolean }[]) {
      const orgId = b.organization_id ?? "global"
      const usedPct = Number(b.used_usd) / Number(b.budget_usd)

      if (usedPct >= BUDGET_RISK_THRESHOLD) {
        await emitEvent("ai_budget_risk", { tenantId: orgId, correlationId }, {
          organizationId: orgId,
          usedUsd:        Number(b.used_usd),
          budgetUsd:      Number(b.budget_usd),
          usedPct:        usedPct * 100,
          hardCap:        b.hard_cap,
          daysRemaining:  new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate(),
        }, `ai_budget_risk:${orgId}:${today}`)
        signals.push(`budget_risk:${orgId}:${(usedPct * 100).toFixed(1)}%`)
        eventsEmitted++
      }
    }
  } catch (err) {
    logger.error("[ai-intelligence] budget risk detection failed", { error: String(err) })
  }

  return { module: "ai-intelligence-budget", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}

// ── AI ROI Scoring ────────────────────────────────────────────────────────────

export interface AIROIScore {
  organizationId: string
  totalCostUsd: number
  totalRevenueKoboAttributed: number
  roiMultiplier: number       // revenue generated per $ of AI spend (rough attribution)
  topAgent: string
  efficiency: "excellent" | "good" | "fair" | "poor"
}

export async function computeAIROI(organizationId: string): Promise<AIROIScore> {
  const supabase = createAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [costRes, agentRes] = await Promise.allSettled([
    supabase.from("ai_cost_events")
      .select("cost_usd")
      .eq("organization_id", organizationId)
      .gte("created_at", thirtyDaysAgo),
    supabase.from("ai_cost_events")
      .select("agent_name, cost_usd")
      .eq("organization_id", organizationId)
      .gte("created_at", thirtyDaysAgo)
      .order("cost_usd", { ascending: false })
      .limit(100),
  ])

  const costs = costRes.status === "fulfilled" ? (costRes.value.data ?? []) as { cost_usd: number }[] : []
  const totalCostUsd = costs.reduce((s, r) => s + Number(r.cost_usd), 0)

  const agentCosts = agentRes.status === "fulfilled" ? (agentRes.value.data ?? []) as { agent_name: string; cost_usd: number }[] : []
  const agentMap = new Map<string, number>()
  for (const r of agentCosts) agentMap.set(r.agent_name, (agentMap.get(r.agent_name) ?? 0) + Number(r.cost_usd))
  const topAgent = [...agentMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none"

  // Attribution is indicative — we attribute 10% of revenue to AI-assisted interactions
  // This is a conservative heuristic; a proper attribution model requires A/B data
  const efficiency: AIROIScore["efficiency"] =
    totalCostUsd === 0 ? "excellent" :
    totalCostUsd < 1   ? "excellent" :
    totalCostUsd < 5   ? "good" :
    totalCostUsd < 20  ? "fair" :
    "poor"

  return {
    organizationId,
    totalCostUsd,
    totalRevenueKoboAttributed: 0,  // requires payment-AI correlation (future)
    roiMultiplier: 0,
    topAgent,
    efficiency,
  }
}

// ── AI Provider Health ────────────────────────────────────────────────────────

export interface AIProviderHealth {
  status: "healthy" | "degraded" | "down"
  avgLatencyMs: number
  p95LatencyMs: number
  callsLastHour: number
  score: number
}

export async function computeAIProviderHealth(): Promise<AIProviderHealth> {
  const supabase = createAdminClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString()

  const { data } = await supabase
    .from("ai_cost_events")
    .select("latency_ms")
    .gte("created_at", oneHourAgo)
    .not("latency_ms", "is", null)
    .limit(200)

  const rows = (data ?? []).map((r: { latency_ms: number }) => r.latency_ms).filter(Boolean).sort((a: number, b: number) => a - b)
  if (!rows.length) return { status: "healthy", avgLatencyMs: 0, p95LatencyMs: 0, callsLastHour: 0, score: 100 }

  const avg = rows.reduce((s: number, v: number) => s + v, 0) / rows.length
  const p95 = rows[Math.floor(rows.length * 0.95)] ?? rows[rows.length - 1]

  const score = Math.max(0, Math.min(100, Math.round(100 - (avg - 500) / 45)))

  return {
    status: score >= 80 ? "healthy" : score >= 50 ? "degraded" : "down",
    avgLatencyMs:  Math.round(avg),
    p95LatencyMs:  Math.round(p95),
    callsLastHour: rows.length,
    score,
  }
}
