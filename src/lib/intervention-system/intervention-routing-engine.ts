import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { InterventionCategory, InterventionSystemRunResult } from "./intervention-events"
import type { AutomationEventName } from "@/lib/automation/events"

type CategoryEventMap = Record<InterventionCategory, AutomationEventName>

const CATEGORY_EVENT: CategoryEventMap = {
  creator: "creator_intervention_required",
  monetization: "monetization_intervention_required",
  retention: "retention_intervention_required",
  governance: "governance_intervention_required",
  scaling: "scaling_intervention_required",
  operational: "operational_intervention_required",
}

function resolveCategory(eventName: string): InterventionCategory | null {
  if (
    eventName.startsWith("creator_") ||
    eventName.startsWith("storefront_") ||
    eventName.startsWith("engagement_")
  ) return "creator"
  if (
    eventName.startsWith("monetization_") ||
    eventName.startsWith("creator_revenue_") ||
    eventName.startsWith("payout_")
  ) return "monetization"
  if (
    eventName.startsWith("retention_") ||
    eventName.startsWith("customer_churn_") ||
    eventName.startsWith("loyalty_")
  ) return "retention"
  if (
    eventName.startsWith("governance_") ||
    eventName.startsWith("marketplace_governance_") ||
    eventName.startsWith("trust_governance_")
  ) return "governance"
  if (
    eventName.startsWith("scaling_") ||
    eventName.startsWith("marketplace_capacity_") ||
    eventName.startsWith("category_saturation_")
  ) return "scaling"
  if (
    eventName.startsWith("operational_") ||
    eventName.startsWith("workflow_") ||
    eventName.startsWith("runtime_") ||
    eventName.startsWith("sla_")
  ) return "operational"
  return null
}

type EventRow = {
  event_name: string
  creator_id: string | null
  created_at: string
}

export async function runInterventionRoutingEngine(): Promise<InterventionSystemRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("intervention-routing")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 3_600_000).toISOString()

    const { data: rows } = await supabase
      .from("automation_events")
      .select("event_name, creator_id, created_at")
      .gte("created_at", oneDayAgo)
      .order("created_at", { ascending: false })

    const byCategory = new Map<InterventionCategory, { count: number; topEventName: string }>()

    for (const row of (rows ?? []) as EventRow[]) {
      const category = resolveCategory(row.event_name)
      if (!category) continue
      const existing = byCategory.get(category)
      if (!existing) {
        byCategory.set(category, { count: 1, topEventName: row.event_name })
      } else {
        existing.count++
      }
    }

    for (const [category, { count, topEventName }] of byCategory.entries()) {
      const targetEvent = CATEGORY_EVENT[category]
      const result = await emitEvent(
        targetEvent,
        { tenantId: "platform", creatorId: "platform" },
        { count, category, topEventName, snapshotDate: today },
        `intervention_routing:${category}:${today}`,
      )
      if (result.ok) {
        eventsEmitted++
        signals.push(`routed:${category}(${count})`)
      }
    }

    logger.info("Intervention routing engine completed", {
      correlationId,
      eventsEmitted,
      categoriesRouted: byCategory.size,
    })

    return {
      module: "intervention-routing-engine",
      eventsEmitted,
      alertsRaised: 0,
      durationMs: Date.now() - start,
      signals,
    }
  } catch (err) {
    logger.error("Intervention routing engine failed", { correlationId, err })
    return {
      module: "intervention-routing-engine",
      eventsEmitted: 0,
      alertsRaised: 0,
      durationMs: Date.now() - start,
      signals: [],
    }
  }
}
