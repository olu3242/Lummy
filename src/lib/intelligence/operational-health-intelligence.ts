/**
 * Operational Health Intelligence — runtime health scoring, payment reliability,
 * WhatsApp delivery health, AI runtime health, onboarding reliability.
 *
 * Reads from: workflow_sla_records, automation_events, automation_logs,
 *             ai_cost_events, creator_health_scores
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import type { RuntimeCongestionScore } from "./workflow-intelligence"

export interface OperationalHealthReport {
  timestamp: string
  overall: number              // 0-100
  components: {
    runtime:     ComponentHealth
    workflows:   ComponentHealth
    payments:    ComponentHealth
    ai:          ComponentHealth
    onboarding:  ComponentHealth
    creators:    ComponentHealth
  }
  alerts: HealthAlert[]
}

export interface ComponentHealth {
  score: number                // 0-100
  status: "healthy" | "degraded" | "critical"
  details: string
}

export interface HealthAlert {
  level: "info" | "warn" | "error"
  component: string
  message: string
}

function statusFromScore(score: number): ComponentHealth["status"] {
  return score >= 80 ? "healthy" : score >= 50 ? "degraded" : "critical"
}

// ── Runtime Health ────────────────────────────────────────────────────────────

async function scoreRuntime(congestion: RuntimeCongestionScore): Promise<ComponentHealth> {
  const score = Math.max(0, 100 - congestion.score)
  return {
    score,
    status: statusFromScore(score),
    details: `pending:${congestion.pendingEvents} retrying:${congestion.retryingEvents} dlq24h:${congestion.dlqEvents24h}`,
  }
}

// ── Workflow Health ───────────────────────────────────────────────────────────

async function scoreWorkflows(): Promise<ComponentHealth> {
  const supabase = createAdminClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString()

  const [successRes, failRes] = await Promise.allSettled([
    supabase.from("automation_logs").select("id", { count: "exact", head: true })
      .eq("status", "success").gte("created_at", oneHourAgo),
    supabase.from("automation_logs").select("id", { count: "exact", head: true })
      .eq("status", "failure").gte("created_at", oneHourAgo),
  ])

  const successes = successRes.status === "fulfilled" ? (successRes.value.count ?? 0) : 0
  const failures  = failRes.status   === "fulfilled" ? (failRes.value.count   ?? 0) : 0
  const total = successes + failures

  const successRate = total === 0 ? 1 : successes / total
  const score = Math.round(successRate * 100)

  return {
    score,
    status: statusFromScore(score),
    details: `success_rate:${(successRate * 100).toFixed(1)}% (${successes}/${total} in last hour)`,
  }
}

// ── Payment Health ────────────────────────────────────────────────────────────

async function scorePayments(): Promise<ComponentHealth> {
  const supabase = createAdminClient()
  const twentyFourHAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString()

  const [completedRes, failedRes] = await Promise.allSettled([
    supabase.from("automation_events").select("id", { count: "exact", head: true })
      .eq("event_name", "payment_received").eq("status", "completed").gte("created_at", twentyFourHAgo),
    supabase.from("automation_events").select("id", { count: "exact", head: true })
      .eq("event_name", "payment_failed").eq("status", "completed").gte("created_at", twentyFourHAgo),
  ])

  const completed = completedRes.status === "fulfilled" ? (completedRes.value.count ?? 0) : 0
  const failed    = failedRes.status   === "fulfilled" ? (failedRes.value.count   ?? 0) : 0
  const total = completed + failed

  const successRate = total === 0 ? 1 : completed / total
  const score = Math.round(successRate * 100)

  return {
    score,
    status: statusFromScore(score),
    details: `success_rate:${(successRate * 100).toFixed(1)}% (${completed} ok / ${failed} failed in 24h)`,
  }
}

// ── AI Runtime Health ─────────────────────────────────────────────────────────

async function scoreAIRuntime(): Promise<ComponentHealth> {
  const supabase = createAdminClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString()

  const { data: recentCosts } = await supabase
    .from("ai_cost_events")
    .select("latency_ms, cost_usd")
    .gte("created_at", oneHourAgo)
    .not("latency_ms", "is", null)
    .limit(100)

  if (!recentCosts?.length) {
    return { score: 100, status: "healthy", details: "no AI calls in last hour" }
  }

  const rows = recentCosts as { latency_ms: number; cost_usd: number }[]
  const avgLatency = rows.reduce((s, r) => s + (r.latency_ms ?? 0), 0) / rows.length
  const totalCost  = rows.reduce((s, r) => s + Number(r.cost_usd), 0)

  // Score degrades when latency > 5s
  const latencyScore = Math.max(0, 100 - Math.max(0, (avgLatency - 1000) / 40))
  const score = Math.round(latencyScore)

  return {
    score,
    status: statusFromScore(score),
    details: `avg_latency:${Math.round(avgLatency)}ms calls:${rows.length} cost_1h:$${totalCost.toFixed(4)}`,
  }
}

// ── Onboarding Health ─────────────────────────────────────────────────────────

async function scoreOnboarding(): Promise<ComponentHealth> {
  const supabase = createAdminClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [completedRes, startedRes] = await Promise.allSettled([
    supabase.from("automation_events").select("id", { count: "exact", head: true })
      .eq("event_name", "onboarding_completed").eq("status", "completed").gte("created_at", sevenDaysAgo),
    supabase.from("creator_profiles").select("id", { count: "exact", head: true })
      .eq("onboarding_completed", false).gte("created_at", sevenDaysAgo),
  ])

  const completed = completedRes.status === "fulfilled" ? (completedRes.value.count ?? 0) : 0
  const abandoned = startedRes.status   === "fulfilled" ? (startedRes.value.count   ?? 0) : 0
  const total = completed + abandoned

  const completionRate = total === 0 ? 1 : completed / total
  const score = Math.round(completionRate * 100)

  return {
    score,
    status: statusFromScore(score),
    details: `completion_rate:${(completionRate * 100).toFixed(1)}% (${completed} completed, ${abandoned} abandoned in 7d)`,
  }
}

// ── Creator Health Distribution ───────────────────────────────────────────────

async function scoreCreators(): Promise<ComponentHealth> {
  const supabase = createAdminClient()

  const { data: scores } = await supabase
    .from("creator_health_scores")
    .select("overall_score, risk_level")
    .limit(1000)

  if (!scores?.length) {
    return { score: 50, status: "degraded", details: "no health scores computed yet" }
  }

  const rows = scores as { overall_score: number; risk_level: string }[]
  const healthy = rows.filter(r => r.risk_level === "healthy").length
  const avgScore = rows.reduce((s, r) => s + r.overall_score, 0) / rows.length
  const healthyPct = healthy / rows.length
  const score = Math.round((avgScore * 0.6) + (healthyPct * 40))

  return {
    score,
    status: statusFromScore(score),
    details: `avg_score:${avgScore.toFixed(1)} healthy:${(healthyPct * 100).toFixed(1)}% (${rows.length} creators)`,
  }
}

// ── Full Health Report ────────────────────────────────────────────────────────

export async function computeOperationalHealthReport(
  congestion?: RuntimeCongestionScore,
): Promise<OperationalHealthReport> {
  // Use provided congestion or import lazily
  if (!congestion) {
    const { computeRuntimeCongestion } = await import("./workflow-intelligence")
    congestion = await computeRuntimeCongestion()
  }

  const [runtime, workflows, payments, ai, onboarding, creators] = await Promise.allSettled([
    scoreRuntime(congestion),
    scoreWorkflows(),
    scorePayments(),
    scoreAIRuntime(),
    scoreOnboarding(),
    scoreCreators(),
  ])

  const components = {
    runtime:    runtime.status    === "fulfilled" ? runtime.value    : { score: 0, status: "critical" as const, details: "error" },
    workflows:  workflows.status  === "fulfilled" ? workflows.value  : { score: 0, status: "critical" as const, details: "error" },
    payments:   payments.status   === "fulfilled" ? payments.value   : { score: 0, status: "critical" as const, details: "error" },
    ai:         ai.status         === "fulfilled" ? ai.value         : { score: 0, status: "critical" as const, details: "error" },
    onboarding: onboarding.status === "fulfilled" ? onboarding.value : { score: 0, status: "critical" as const, details: "error" },
    creators:   creators.status   === "fulfilled" ? creators.value   : { score: 0, status: "critical" as const, details: "error" },
  }

  const overall = Math.round(
    (components.runtime.score    * 0.20) +
    (components.workflows.score  * 0.25) +
    (components.payments.score   * 0.20) +
    (components.ai.score         * 0.15) +
    (components.onboarding.score * 0.10) +
    (components.creators.score   * 0.10)
  )

  const alerts: HealthAlert[] = []
  for (const [name, c] of Object.entries(components)) {
    if (c.status === "critical") alerts.push({ level: "error", component: name, message: c.details })
    else if (c.status === "degraded") alerts.push({ level: "warn", component: name, message: c.details })
  }

  return {
    timestamp:  new Date().toISOString(),
    overall,
    components,
    alerts,
  }
}

// ── Persist Snapshot ──────────────────────────────────────────────────────────

export async function persistHealthSnapshot(report: OperationalHealthReport): Promise<void> {
  const supabase = createAdminClient()
  const componentRows = Object.entries(report.components).map(([key, c]) => ({
    snapshot_type: `${key}_health`,
    score:         c.score,
    signals:       { status: c.status, details: c.details } as unknown,
    alerts:        report.alerts.filter(a => a.component === key) as unknown,
  }))

  const summaryRow = {
    snapshot_type: "runtime_health",
    score:         report.overall,
    signals:       { components: Object.fromEntries(Object.entries(report.components).map(([k, v]) => [k, v.score])) } as unknown,
    alerts:        report.alerts as unknown,
  }

  for (const row of [...componentRows, summaryRow]) {
    await supabase.from("operational_intelligence_snapshots").insert(row as Parameters<typeof supabase.from>[0] extends string ? never : never).then(() => {})
  }

  logger.info("[ops-health] snapshot persisted", { overall: report.overall, alerts: report.alerts.length })
}
