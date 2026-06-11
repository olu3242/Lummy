import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { InterventionSystemRunResult } from "./intervention-events"

type DuplicateRow = {
  creator_id: string | null
  event_name: string
  ids: string[]
}

export async function runInterventionCompressionEngine(): Promise<InterventionSystemRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("intervention-compression")
  const signals: string[] = []
  let suppressed = 0
  let staled = 0

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 3_600_000).toISOString()
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

    const { data: duplicateCandidates } = await supabase
      .from("automation_events")
      .select("id, creator_id, event_name, created_at")
      .gte("created_at", oneDayAgo)
      .gte("priority", 6)
      .in("status", ["pending", "retrying"])
      .order("created_at", { ascending: false })

    const groupMap = new Map<string, string[]>()
    for (const row of (duplicateCandidates ?? []) as { id: string; creator_id: string | null; event_name: string }[]) {
      const key = `${row.creator_id ?? "null"}:${row.event_name}`
      const group = groupMap.get(key) ?? []
      group.push(row.id)
      groupMap.set(key, group)
    }

    const toSuppress: string[] = []
    for (const [, ids] of groupMap.entries()) {
      if (ids.length > 3) {
        // ids are ordered newest-first; keep the 2 most recent, suppress the rest
        toSuppress.push(...ids.slice(2))
      }
    }

    if (toSuppress.length > 0) {
      const { error } = await supabase
        .from("automation_events")
        .update({ status: "suppressed" })
        .in("id", toSuppress)
      if (!error) {
        suppressed = toSuppress.length
      } else {
        logger.warn("Failed to suppress duplicate events", { correlationId, error })
      }
    }

    const { data: staleRows } = await supabase
      .from("automation_events")
      .select("id")
      .eq("status", "pending")
      .gte("priority", 7)
      .lt("created_at", sevenDaysAgo)

    const staleIds = ((staleRows ?? []) as { id: string }[]).map((r) => r.id)

    if (staleIds.length > 0) {
      const { error } = await supabase
        .from("automation_events")
        .update({ status: "dead_letter", last_error: "Stale low-priority signal cleaned up" })
        .in("id", staleIds)
      if (!error) {
        staled = staleIds.length
      } else {
        logger.warn("Failed to dead-letter stale events", { correlationId, error })
      }
    }

    signals.push(`suppressed:${suppressed}`, `staled:${staled}`)

    logger.info("Intervention compression engine completed", {
      correlationId,
      suppressed,
      staled,
    })

    return {
      module: "intervention-compression-engine",
      eventsEmitted: 0,
      alertsRaised: 0,
      durationMs: Date.now() - start,
      signals,
    }
  } catch (err) {
    logger.error("Intervention compression engine failed", { correlationId, err })
    return {
      module: "intervention-compression-engine",
      eventsEmitted: 0,
      alertsRaised: 0,
      durationMs: Date.now() - start,
      signals: [],
    }
  }
}
