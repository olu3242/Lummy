import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { InterventionRecord, InterventionUrgency, InterventionSystemRunResult } from "./intervention-events"

const URGENCY_MULTIPLIER: Record<InterventionUrgency, number> = {
  critical: 2.0,
  high: 1.5,
  medium: 1.0,
  low: 0.5,
}

export function rankInterventions(interventions: InterventionRecord[]): InterventionRecord[] {
  return interventions
    .map((item) => ({
      ...item,
      priorityScore: Math.min(100, Math.round(item.rawScore * URGENCY_MULTIPLIER[item.urgency])),
    }))
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore
      return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    })
}

type MemoryRow = {
  value: string | null
}

export async function runInterventionRankingEngine(): Promise<InterventionSystemRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("intervention-ranking")
  const signals: string[] = []

  try {
    const { data: memoryRow } = await supabase
      .from("marketplace_memory")
      .select("value")
      .eq("namespace", "kernel")
      .eq("entity_id", "platform")
      .eq("memory_key", "top_interventions")
      .maybeSingle()

    const raw = (memoryRow as MemoryRow | null)?.value
    let interventions: InterventionRecord[] = []

    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          interventions = parsed as InterventionRecord[]
        }
      } catch {
        logger.warn("Failed to parse top_interventions in ranking engine", { correlationId })
      }
    }

    const ranked = rankInterventions(interventions)

    signals.push(...ranked.slice(0, 10).map((i) => `[${i.priorityScore}] ${i.title}`))

    logger.info("Intervention ranking engine completed", {
      correlationId,
      ranked: ranked.length,
    })

    return {
      module: "intervention-ranking-engine",
      eventsEmitted: 0,
      alertsRaised: 0,
      durationMs: Date.now() - start,
      signals,
      interventionsRanked: ranked.length,
    }
  } catch (err) {
    logger.error("Intervention ranking engine failed", { correlationId, err })
    return {
      module: "intervention-ranking-engine",
      eventsEmitted: 0,
      alertsRaised: 0,
      durationMs: Date.now() - start,
      signals: [],
      interventionsRanked: 0,
    }
  }
}
