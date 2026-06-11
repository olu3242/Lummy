import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type {
  KernelRunResult,
  MarketplaceStateSnapshot,
  MarketplaceScoreBundle,
  OperationalScoreBundle,
  InterventionItem,
} from "./kernel-events"

export async function runMarketplaceStateEngine(): Promise<KernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("marketplace-state")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []

  try {
    const [memoryRes, marketplaceHealthRes] = await Promise.allSettled([
      supabase
        .from("marketplace_memory")
        .select("memory_key, value")
        .eq("namespace", "kernel")
        .eq("entity_id", "platform")
        .in("memory_key", ["operational_truth", "top_interventions"])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`),
      supabase
        .from("marketplace_health_snapshots")
        .select("overall_score, retention_score, conversion_score, growth_score, snapshot_date")
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .single(),
    ])

    type MemRow = { memory_key: string; value: string }
    const memoryRows = memoryRes.status === "fulfilled" ? (memoryRes.value.data ?? []) : []
    const healthRow = marketplaceHealthRes.status === "fulfilled" ? marketplaceHealthRes.value.data : null

    const memMap = new Map<string, string>()
    for (const row of memoryRows as MemRow[]) {
      memMap.set(row.memory_key, row.value)
    }

    let operational: OperationalScoreBundle = {
      runtimeHealthScore: 50,
      workflowHealthScore: 50,
      monetizationHealthScore: 50,
      slaHealthScore: 50,
      aiEfficiencyScore: 80,
      compositeScore: 62,
      snapshotDate: today,
    }

    const operationalRaw = memMap.get("operational_truth")
    if (operationalRaw) {
      try {
        operational = JSON.parse(operationalRaw) as OperationalScoreBundle
      } catch {
        // Use defaults if stored value is malformed
      }
    }

    let topInterventions: InterventionItem[] = []
    const interventionsRaw = memMap.get("top_interventions")
    if (interventionsRaw) {
      try {
        topInterventions = JSON.parse(interventionsRaw) as InterventionItem[]
      } catch {
        // Use empty if stored value is malformed
      }
    }

    const healthScore = healthRow ? Math.round(healthRow.overall_score) : 50
    const retentionScore = healthRow ? Math.round(healthRow.retention_score) : 50
    const conversionScore = healthRow ? Math.round(healthRow.conversion_score) : 50
    const growthScore = healthRow ? Math.round(healthRow.growth_score) : 50

    const integrityRes = await supabase
      .from("marketplace_integrity_snapshots")
      .select("overall_integrity_score")
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .single()

    const integrityScore = integrityRes.data ? Math.round(integrityRes.data.overall_integrity_score) : 50
    const compositeScore = Math.round(
      (healthScore + growthScore + integrityScore + conversionScore + retentionScore) / 5,
    )

    const creatorBundle: MarketplaceScoreBundle = {
      healthScore,
      growthScore,
      integrityScore,
      conversionScore,
      retentionScore,
      compositeScore,
      snapshotDate: today,
    }

    const snapshot: MarketplaceStateSnapshot = {
      creator: creatorBundle,
      operational,
      topInterventions,
      signalCount: topInterventions.length,
      suppressedCount: 0,
      snapshotDate: today,
    }

    await supabase.from("marketplace_memory").upsert(
      {
        namespace: "kernel",
        entity_id: "platform",
        memory_key: "marketplace_state",
        value: JSON.stringify(snapshot),
        expires_at: new Date(Date.now() + 25 * 3600_000).toISOString(),
      },
      { onConflict: "namespace,entity_id,memory_key" },
    )

    signals.push(
      `marketplace_health:${healthScore}`,
      `operational_composite:${operational.compositeScore}`,
      `interventions_loaded:${topInterventions.length}`,
      `marketplace_composite:${compositeScore}`,
    )

    logger.info("[marketplace-state] engine complete", { compositeScore, interventions: topInterventions.length, correlationId })

    return {
      module: "marketplace-state",
      eventsEmitted: 0,
      alertsRaised: 0,
      durationMs: Date.now() - start,
      signals,
    }
  } catch (err) {
    logger.error("[marketplace-state] engine failed", { error: String(err) })
    return { module: "marketplace-state", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }
}
