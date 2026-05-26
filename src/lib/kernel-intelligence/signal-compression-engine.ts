import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { KernelRunResult } from "./kernel-events"

export async function runSignalCompressionEngine(): Promise<KernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("signal-compression")
  const signals: string[] = []
  let suppressedCount = 0
  let staledCount = 0

  try {
    const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString()
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

    const { data: recentEvents } = await supabase
      .from("automation_events")
      .select("id, event_name, creator_id, priority, status, created_at")
      .gte("created_at", oneDayAgo)
      .eq("processed", false)
      .neq("status", "suppressed")
      .neq("status", "dead_letter")
      .order("created_at", { ascending: true })

    if (recentEvents && recentEvents.length > 0) {
      type EventRow = { id: string; event_name: string; creator_id: string; priority: number; status: string; created_at: string }

      const grouped = new Map<string, EventRow[]>()
      for (const event of recentEvents as EventRow[]) {
        const key = `${event.event_name}:${event.creator_id ?? "platform"}`
        const bucket = grouped.get(key) ?? []
        bucket.push(event)
        grouped.set(key, bucket)
      }

      const toSuppress: string[] = []
      for (const [, bucket] of grouped) {
        if (bucket.length <= 3) continue
        const excess = bucket.slice(3)
        for (const event of excess) {
          if ((event.priority ?? 5) >= 6) {
            toSuppress.push(event.id)
          }
        }
      }

      if (toSuppress.length > 0) {
        const batchSize = 100
        for (let i = 0; i < toSuppress.length; i += batchSize) {
          const batch = toSuppress.slice(i, i + batchSize)
          await supabase
            .from("automation_events")
            .update({ status: "suppressed" })
            .in("id", batch)
        }
        suppressedCount = toSuppress.length
      }
    }

    const { data: staleEvents } = await supabase
      .from("automation_events")
      .select("id")
      .lt("created_at", sevenDaysAgo)
      .eq("status", "pending")
      .gte("priority", 7)

    if (staleEvents && staleEvents.length > 0) {
      const staleIds = staleEvents.map((e: { id: string }) => e.id)
      const batchSize = 100
      for (let i = 0; i < staleIds.length; i += batchSize) {
        const batch = staleIds.slice(i, i + batchSize)
        await supabase
          .from("automation_events")
          .update({ status: "dead_letter" })
          .in("id", batch)
      }
      staledCount = staleIds.length
    }

    signals.push(`suppressed:${suppressedCount}`, `staled:${staledCount}`)
    logger.info("[signal-compression] engine complete", { suppressedCount, staledCount, correlationId })

    return {
      module: "signal-compression",
      eventsEmitted: 0,
      alertsRaised: 0,
      durationMs: Date.now() - start,
      signals,
    }
  } catch (err) {
    logger.error("[signal-compression] engine failed", { error: String(err) })
    return { module: "signal-compression", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }
}
