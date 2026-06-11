/**
 * Canonical Workflow Registry Service
 *
 * Single source of truth for resolving event_name → workflow metadata.
 * Consumed by the automation processor to attach workflow_id, SLA config,
 * and queue routing to every automation_events execution.
 *
 * Cache refreshes every 5 minutes to pick up registry changes without restart.
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"

export interface WorkflowEntry {
  workflowId: string
  name: string
  description: string | null
  status: "active" | "paused" | "draft" | "deprecated" | "canary"
  slaMaxMs: number | null
  queueName: string | null
  rolloutPct: number
  version: number
}

const CACHE_TTL_MS = 5 * 60_000

let _cache: Map<string, WorkflowEntry> | null = null   // event_name → WorkflowEntry
let _cacheAt = 0

async function loadRegistry(): Promise<Map<string, WorkflowEntry>> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("workflow_registry")
    .select("workflow_id, name, description, version, status, triggers, queue_name, sla_max_ms, rollout_pct")
    .eq("status", "active")

  if (error) {
    logger.warn("[registry] failed to load workflow_registry", { error: error.message })
    return new Map()
  }

  const map = new Map<string, WorkflowEntry>()
  for (const row of (data ?? []) as {
    workflow_id: string
    name: string
    description: string | null
    version: number
    status: string
    triggers: string[] | null
    queue_name: string | null
    sla_max_ms: number | null
    rollout_pct: number
  }[]) {
    const entry: WorkflowEntry = {
      workflowId:  row.workflow_id,
      name:        row.name,
      description: row.description,
      status:      row.status as WorkflowEntry["status"],
      slaMaxMs:    row.sla_max_ms,
      queueName:   row.queue_name,
      rolloutPct:  row.rollout_pct ?? 100,
      version:     row.version,
    }
    // Index each trigger event name
    for (const triggerName of (row.triggers ?? [])) {
      map.set(triggerName, entry)
    }
    // Also index by workflow_id directly for explicit lookups
    map.set(row.workflow_id, entry)
  }

  return map
}

async function getRegistry(): Promise<Map<string, WorkflowEntry>> {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL_MS) return _cache
  try {
    _cache = await loadRegistry()
    _cacheAt = Date.now()
    logger.debug("[registry] refreshed", { entries: _cache.size })
  } catch {
    _cache = _cache ?? new Map()  // use stale on failure
  }
  return _cache
}

/** Resolve the canonical workflow entry for a given event name. */
export async function getWorkflowByEventName(eventName: string): Promise<WorkflowEntry | null> {
  const registry = await getRegistry()
  return registry.get(eventName) ?? null
}

/** Get SLA target for a workflow, null if unconfigured. */
export async function getWorkflowSLA(workflowIdOrEventName: string): Promise<number | null> {
  const registry = await getRegistry()
  return registry.get(workflowIdOrEventName)?.slaMaxMs ?? null
}

/** Get execution metadata for a workflow. Includes rollout_pct for feature-flag-style gating. */
export async function getWorkflowExecutionMetadata(eventName: string): Promise<{
  workflowId: string | null
  slaMaxMs: number | null
  queueName: string | null
  rolloutPct: number
} | null> {
  const entry = await getWorkflowByEventName(eventName)
  if (!entry) return null
  return {
    workflowId: entry.workflowId,
    slaMaxMs:   entry.slaMaxMs,
    queueName:  entry.queueName,
    rolloutPct: entry.rolloutPct,
  }
}

/** Force-invalidate the registry cache (use after workflow_registry mutations). */
export function invalidateRegistryCache(): void {
  _cache = null
  _cacheAt = 0
}
