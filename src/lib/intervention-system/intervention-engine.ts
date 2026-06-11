import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { InterventionRecord, InterventionCategory, InterventionUrgency, InterventionSystemRunResult } from "./intervention-events"

const TITLE_MAP: Record<string, string> = {
  creator_retention_risk: "Creator retention at risk",
  customer_retention_recovery_needed: "Customer recovery needed",
  creator_revenue_risk: "Creator revenue risk",
  monetization_interruption_detected: "Revenue interrupted",
  marketplace_scaling_bottleneck: "Scaling bottleneck detected",
  scaling_governance_alert: "Scaling governance alert",
  marketplace_integrity_risk: "Marketplace integrity at risk",
  governance_intervention_required: "Governance intervention needed",
  operational_intervention_required: "Runtime health degraded",
  engagement_decay: "Engagement declining",
  creator_recovery_required: "Creator recovery needed",
  storefront_recovery_required: "Storefront needs refresh",
}

const ACTION_MAP: Record<string, string> = {
  creator_retention_risk: "Contact creator and review account health",
  monetization_interruption_detected: "Investigate revenue interruption",
  marketplace_scaling_bottleneck: "Review event queue and processor frequency",
  marketplace_integrity_risk: "Review trust scores and dispute signals",
  governance_intervention_required: "Review governance dashboard",
}

function humanizeEventName(name: string): string {
  return TITLE_MAP[name] ?? name.replace(/_/g, " ")
}

function resolveAction(name: string): string {
  return ACTION_MAP[name] ?? "Review event details in dashboard"
}

function resolveCategory(eventName: string): InterventionCategory {
  if (eventName.startsWith("creator_") || eventName.startsWith("storefront_") || eventName.startsWith("engagement_")) {
    return "creator"
  }
  if (eventName.startsWith("monetization_") || eventName.startsWith("creator_revenue_") || eventName.startsWith("payout_")) {
    return "monetization"
  }
  if (eventName.startsWith("retention_") || eventName.startsWith("customer_") || eventName.startsWith("loyalty_")) {
    return "retention"
  }
  if (eventName.startsWith("governance_") || eventName.startsWith("marketplace_governance_") || eventName.startsWith("trust_governance_")) {
    return "governance"
  }
  if (
    eventName.startsWith("scaling_") ||
    eventName.startsWith("marketplace_capacity_") ||
    eventName.startsWith("category_saturation_")
  ) {
    return "scaling"
  }
  return "operational"
}

function priorityToUrgency(priority: number): InterventionUrgency {
  if (priority === 1) return "critical"
  if (priority === 2) return "high"
  return "medium"
}

type EventRow = {
  id: string
  event_name: string
  creator_id: string | null
  payload: Record<string, unknown> | null
  created_at: string
  priority: number
}

type MemoryRow = {
  value: string | null
}

export async function runInterventionEngine(): Promise<InterventionSystemRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("intervention-engine")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 3_600_000).toISOString()

    const [memoryRes, eventsRes] = await Promise.allSettled([
      supabase
        .from("marketplace_memory")
        .select("value")
        .eq("namespace", "kernel")
        .eq("entity_id", "platform")
        .eq("memory_key", "top_interventions")
        .maybeSingle(),
      supabase
        .from("automation_events")
        .select("id, event_name, creator_id, payload, created_at, priority")
        .in("status", ["pending", "retrying", "failed"])
        .lte("priority", 3)
        .gte("created_at", fortyEightHoursAgo)
        .order("priority", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(50),
    ])

    const memoryRow: MemoryRow | null =
      memoryRes.status === "fulfilled" ? (memoryRes.value.data as MemoryRow | null) : null

    const liveEvents: EventRow[] =
      eventsRes.status === "fulfilled" ? ((eventsRes.value.data ?? []) as EventRow[]) : []

    const persistedInterventions: InterventionRecord[] = []
    if (memoryRow?.value) {
      try {
        const parsed = JSON.parse(memoryRow.value)
        if (Array.isArray(parsed)) {
          persistedInterventions.push(...(parsed as InterventionRecord[]))
        }
      } catch {
        logger.warn("Failed to parse top_interventions from marketplace_memory", { correlationId })
      }
    }

    const liveInterventions: InterventionRecord[] = liveEvents.map((row) => {
      const rawScore = (4 - row.priority) * 25
      return {
        id: row.id,
        category: resolveCategory(row.event_name),
        eventName: row.event_name,
        creatorId: row.creator_id ?? undefined,
        urgency: priorityToUrgency(row.priority),
        priorityScore: rawScore,
        rawScore,
        title: humanizeEventName(row.event_name),
        signal: row.event_name,
        recommendedAction: resolveAction(row.event_name),
        detectedAt: row.created_at,
        snapshotDate: today,
      }
    })

    const merged = new Map<string, InterventionRecord>()

    for (const item of [...persistedInterventions, ...liveInterventions]) {
      const key = `${item.creatorId ?? "platform"}:${item.eventName}`
      const existing = merged.get(key)
      if (!existing || item.rawScore > existing.rawScore) {
        merged.set(key, item)
      }
    }

    const sorted = Array.from(merged.values()).sort((a, b) => b.rawScore - a.rawScore)

    signals.push(...sorted.slice(0, 10).map((i) => `[${i.urgency}] ${i.title}`))

    const criticalOrHighCreator = sorted.filter(
      (i) => i.category === "creator" && (i.urgency === "critical" || i.urgency === "high"),
    )

    if (criticalOrHighCreator.length >= 3) {
      const result = await emitEvent(
        "creator_intervention_required",
        { tenantId: "platform", creatorId: "platform" },
        { count: criticalOrHighCreator.length, topIntervention: sorted[0], snapshotDate: today },
        `intervention_engine:platform:${today}`,
      )
      if (result.ok) eventsEmitted++
    }

    logger.info("Intervention engine completed", {
      correlationId,
      merged: sorted.length,
      eventsEmitted,
    })

    return {
      module: "intervention-engine",
      eventsEmitted,
      alertsRaised: criticalOrHighCreator.length >= 3 ? 1 : 0,
      durationMs: Date.now() - start,
      signals,
      interventionsRanked: sorted.length,
    }
  } catch (err) {
    logger.error("Intervention engine failed", { correlationId, err })
    return {
      module: "intervention-engine",
      eventsEmitted: 0,
      alertsRaised: 0,
      durationMs: Date.now() - start,
      signals: [],
      interventionsRanked: 0,
    }
  }
}
