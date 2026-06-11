/**
 * Workflow Intelligence — SLA breach prediction, retry analysis, DLQ trends,
 * throughput analysis, runtime congestion scoring.
 *
 * Reads from: workflow_sla_records, automation_events, automation_logs
 * Emits: workflow_retry_spike, workflow_at_risk
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { emitEvent } from "@/lib/automation/sdk"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { IntelligenceRunResult } from "./intelligence-events"

const RETRY_SPIKE_THRESHOLD = 10      // >10 retries in 30min window = spike
const DLQ_SPIKE_THRESHOLD   = 5       // >5 DLQ events in 1hr = spike
const SLA_BREACH_RATE_WARN  = 0.20    // >20% breach rate = workflow at risk

// ── SLA Breach Analysis ───────────────────────────────────────────────────────

export interface WorkflowSLAAnalysis {
  workflowId: string
  totalExecutions: number
  breachCount: number
  breachRate: number
  avgDurationMs: number
  p95DurationMs: number
  slaTargetMs: number
  atRisk: boolean
}

export async function analyzeWorkflowSLAHealth(): Promise<WorkflowSLAAnalysis[]> {
  const supabase = createAdminClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const { data: slaRows } = await supabase
    .from("workflow_sla_records")
    .select("workflow_id, duration_ms, sla_target_ms, breached, status")
    .gte("started_at", sevenDaysAgo)
    .order("started_at", { ascending: false })
    .limit(2000)

  if (!slaRows?.length) return []

  const byWorkflow = new Map<string, {
    durations: number[]; breaches: number; total: number; slaTarget: number
  }>()

  for (const row of slaRows as { workflow_id: string; duration_ms: number | null; sla_target_ms: number | null; breached: boolean; status: string }[]) {
    if (row.status !== "completed" && row.status !== "failed") continue
    const c = byWorkflow.get(row.workflow_id) ?? { durations: [], breaches: 0, total: 0, slaTarget: row.sla_target_ms ?? 30000 }
    c.total++
    if (row.duration_ms) c.durations.push(row.duration_ms)
    if (row.breached) c.breaches++
    byWorkflow.set(row.workflow_id, c)
  }

  const results: WorkflowSLAAnalysis[] = []
  for (const [workflowId, c] of byWorkflow.entries()) {
    const sorted = [...c.durations].sort((a, b) => a - b)
    const avg = sorted.length ? sorted.reduce((s, v) => s + v, 0) / sorted.length : 0
    const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1] : 0
    const breachRate = c.total > 0 ? c.breaches / c.total : 0

    results.push({
      workflowId,
      totalExecutions: c.total,
      breachCount:     c.breaches,
      breachRate,
      avgDurationMs:   Math.round(avg),
      p95DurationMs:   Math.round(p95),
      slaTargetMs:     c.slaTarget,
      atRisk:          breachRate > SLA_BREACH_RATE_WARN,
    })
  }

  return results.sort((a, b) => b.breachRate - a.breachRate)
}

// ── Retry Spike Detection ─────────────────────────────────────────────────────

export async function detectRetrySplikes(): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("wi")
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60_000).toISOString()
    const today = new Date().toISOString().split("T")[0]

    // Count retrying events in window
    const { count: retryCount } = await supabase
      .from("automation_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "retrying")
      .gte("updated_at", thirtyMinAgo)

    if ((retryCount ?? 0) > RETRY_SPIKE_THRESHOLD) {
      // Identify which workflows are spiking
      const { data: spikingEvents } = await supabase
        .from("automation_events")
        .select("event_name, workflow_id")
        .eq("status", "retrying")
        .gte("updated_at", thirtyMinAgo)
        .limit(100)

      const workflowCounts = new Map<string, number>()
      for (const ev of (spikingEvents ?? []) as { event_name: string; workflow_id: string | null }[]) {
        const key = ev.workflow_id ?? ev.event_name
        workflowCounts.set(key, (workflowCounts.get(key) ?? 0) + 1)
      }

      for (const [workflowId, count] of workflowCounts.entries()) {
        if (count >= 3) {
          await emitEvent("workflow_retry_spike", { tenantId: "system", correlationId }, {
            workflowId,
            retryCount: count,
            windowMinutes: 30,
            threshold: RETRY_SPIKE_THRESHOLD,
          }, `workflow_retry_spike:${workflowId}:${today}`)
          signals.push(`retry_spike:${workflowId}:${count}`)
          eventsEmitted++
        }
      }
    }

    // Check DLQ spike
    const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString()
    const { count: dlqCount } = await supabase
      .from("automation_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "dead_letter")
      .gte("updated_at", oneHourAgo)

    if ((dlqCount ?? 0) > DLQ_SPIKE_THRESHOLD) {
      await emitEvent("workflow_at_risk", { tenantId: "system", correlationId }, {
        signal: "dlq_spike",
        dlqCount,
        windowMinutes: 60,
        threshold: DLQ_SPIKE_THRESHOLD,
      }, `workflow_at_risk:dlq:${today}`)
      signals.push(`dlq_spike:${dlqCount}`)
      eventsEmitted++
    }
  } catch (err) {
    logger.error("[workflow-intelligence] retry spike detection failed", { error: String(err) })
  }

  return { module: "workflow-intelligence", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}

// ── Runtime Congestion Scoring ────────────────────────────────────────────────

export interface RuntimeCongestionScore {
  score: number              // 0-100 (100 = most congested)
  pendingEvents: number
  processingEvents: number
  retryingEvents: number
  dlqEvents24h: number
  avgProcessingTimeSec: number
  congestionLevel: "normal" | "elevated" | "high" | "critical"
}

export async function computeRuntimeCongestion(): Promise<RuntimeCongestionScore> {
  const supabase = createAdminClient()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString()

  const [pendingRes, processingRes, retryingRes, dlqRes] = await Promise.allSettled([
    supabase.from("automation_events").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("automation_events").select("id", { count: "exact", head: true }).eq("status", "processing"),
    supabase.from("automation_events").select("id", { count: "exact", head: true }).eq("status", "retrying"),
    supabase.from("automation_events").select("id", { count: "exact", head: true }).eq("status", "dead_letter").gte("updated_at", oneDayAgo),
  ])

  const pending    = pendingRes.status    === "fulfilled" ? (pendingRes.value.count    ?? 0) : 0
  const processing = processingRes.status === "fulfilled" ? (processingRes.value.count ?? 0) : 0
  const retrying   = retryingRes.status   === "fulfilled" ? (retryingRes.value.count   ?? 0) : 0
  const dlq24h     = dlqRes.status        === "fulfilled" ? (dlqRes.value.count        ?? 0) : 0

  // Avg execution time from recent completions
  const { data: recent } = await supabase
    .from("automation_events")
    .select("execution_duration_ms")
    .eq("status", "completed")
    .not("execution_duration_ms", "is", null)
    .gte("updated_at", new Date(Date.now() - 60 * 60_000).toISOString())
    .limit(100)

  const durations = (recent ?? []).map((r: { execution_duration_ms: number }) => r.execution_duration_ms).filter(Boolean)
  const avgMs = durations.length ? durations.reduce((s: number, v: number) => s + v, 0) / durations.length : 0

  // Congestion score: weighted combination of queue depth signals
  const score = Math.min(100, Math.round(
    (pending    * 0.5) +
    (retrying   * 2)   +
    (dlq24h     * 3)   +
    (processing * 1)
  ))

  const congestionLevel =
    score >= 80 ? "critical" :
    score >= 50 ? "high" :
    score >= 20 ? "elevated" :
    "normal"

  return {
    score,
    pendingEvents: pending,
    processingEvents: processing,
    retryingEvents: retrying,
    dlqEvents24h: dlq24h,
    avgProcessingTimeSec: Math.round(avgMs / 1000),
    congestionLevel,
  }
}
