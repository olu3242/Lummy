/**
 * Workflow SLA tracking
 *
 * Usage:
 *   const sla = await startSLARecord("WA-01", tenantId, correlationId)
 *   // ... do work ...
 *   await completeSLARecord(sla.id, "completed")
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"

export interface SLARecord {
  id: string
  workflowId: string
  startedAt: number
  slaTargetMs: number | null
}

// Cache SLA targets from workflow_registry (refreshed on first call)
let _slaCache: Map<string, number | null> | null = null
let _slaCacheAt = 0
const SLA_CACHE_TTL = 60_000

async function getSLATarget(workflowId: string): Promise<number | null> {
  if (!_slaCache || Date.now() - _slaCacheAt > SLA_CACHE_TTL) {
    try {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from("workflow_registry")
        .select("workflow_id, sla_max_ms")
      _slaCache = new Map()
      for (const row of (data ?? []) as { workflow_id: string; sla_max_ms: number | null }[]) {
        _slaCache.set(row.workflow_id, row.sla_max_ms)
      }
      _slaCacheAt = Date.now()
    } catch {
      _slaCache = new Map()
    }
  }
  return _slaCache.get(workflowId) ?? null
}

export async function startSLARecord(
  workflowId: string,
  tenantId?: string,
  correlationId?: string,
  eventId?: string,
): Promise<SLARecord> {
  const slaTargetMs = await getSLATarget(workflowId)
  const startedAt = Date.now()

  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("workflow_sla_records")
      .insert({
        workflow_id:    workflowId,
        event_id:       eventId ?? null,
        tenant_id:      tenantId ?? null,
        started_at:     new Date(startedAt).toISOString(),
        sla_target_ms:  slaTargetMs,
        status:         "running",
        correlation_id: correlationId ?? null,
      })
      .select("id")
      .single()

    return {
      id:           (data as { id: string } | null)?.id ?? crypto.randomUUID(),
      workflowId,
      startedAt,
      slaTargetMs,
    }
  } catch {
    return { id: crypto.randomUUID(), workflowId, startedAt, slaTargetMs }
  }
}

export async function completeSLARecord(
  record: SLARecord,
  status: "completed" | "failed",
  error?: string,
): Promise<void> {
  const durationMs = Date.now() - record.startedAt
  const breached = record.slaTargetMs != null && durationMs > record.slaTargetMs

  if (breached) {
    logger.warn("[sla] breach detected", {
      workflowId:   record.workflowId,
      durationMs,
      slaTargetMs:  record.slaTargetMs,
      overshootMs:  durationMs - (record.slaTargetMs ?? 0),
    })
  }

  try {
    const supabase = createAdminClient()
    await supabase
      .from("workflow_sla_records")
      .update({
        completed_at: new Date().toISOString(),
        duration_ms:  durationMs,
        breached,
        status,
        error: error ?? null,
      })
      .eq("id", record.id)
  } catch {
    // Best-effort — never block on SLA tracking failure
  }
}
