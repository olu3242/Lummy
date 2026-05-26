import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { InterventionRecord, InterventionSystemRunResult } from "./intervention-events"

const GOVERNANCE_EVENTS = [
  "marketplace_governance_risk",
  "marketplace_integrity_risk",
  "trust_governance_degraded",
  "monetization_governance_alert",
  "ecosystem_integrity_risk",
  "governance_intervention_required",
] as const

type EventRow = {
  id: string
  event_name: string
  creator_id: string | null
  payload: Record<string, unknown> | null
  created_at: string
  priority: number | null
}

export async function runInterventionGovernanceEngine(): Promise<InterventionSystemRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("intervention-governance")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

    const { data: rows } = await supabase
      .from("automation_events")
      .select("id, event_name, creator_id, payload, created_at, priority")
      .in("event_name", GOVERNANCE_EVENTS)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(10)

    const interventions: InterventionRecord[] = ((rows ?? []) as EventRow[]).map((row) => {
      const priority = row.priority ?? 5
      const rawScore = Math.max(0, (6 - Math.min(priority, 5)) * 20)
      return {
        id: row.id,
        category: "governance",
        eventName: row.event_name,
        creatorId: row.creator_id ?? undefined,
        urgency: priority <= 1 ? "critical" : priority <= 2 ? "high" : priority <= 3 ? "medium" : "low",
        priorityScore: rawScore,
        rawScore,
        title: row.event_name.replace(/_/g, " "),
        signal: row.event_name,
        recommendedAction: "Review governance dashboard",
        detectedAt: row.created_at,
        snapshotDate: today,
      }
    })

    signals.push(...interventions.map((i) => `[${i.urgency}] ${i.eventName}`))

    logger.info("Intervention governance engine completed", {
      correlationId,
      interventions: interventions.length,
    })

    return {
      module: "intervention-governance-engine",
      eventsEmitted: 0,
      alertsRaised: 0,
      durationMs: Date.now() - start,
      signals,
      interventionsRanked: interventions.length,
    }
  } catch (err) {
    logger.error("Intervention governance engine failed", { correlationId, err })
    return {
      module: "intervention-governance-engine",
      eventsEmitted: 0,
      alertsRaised: 0,
      durationMs: Date.now() - start,
      signals: [],
      interventionsRanked: 0,
    }
  }
}
