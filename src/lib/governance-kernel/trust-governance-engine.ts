import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { KernelRunResult } from "@/lib/kernel-intelligence/kernel-events"

export async function runTrustGovernanceEngine(): Promise<KernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("trust-governance")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let alertsRaised = 0

  try {
    const [trustScoresRes, integritySnapshotsRes] = await Promise.allSettled([
      supabase
        .from("creator_trust_scores")
        .select("trust_score, tier"),
      supabase
        .from("marketplace_integrity_snapshots")
        .select("overall_integrity_score, snapshot_date")
        .order("snapshot_date", { ascending: false })
        .limit(2),
    ])

    type TrustRow = { trust_score: number; tier: string }
    type IntegrityRow = { overall_integrity_score: number; snapshot_date: string }

    const trustRows = trustScoresRes.status === "fulfilled" ? (trustScoresRes.value.data ?? []) as TrustRow[] : []
    const integrityRows = integritySnapshotsRes.status === "fulfilled" ? (integritySnapshotsRes.value.data ?? []) as IntegrityRow[] : []

    const atRiskCount = trustRows.filter(r => r.tier === "at_risk").length
    const avgTrustScore = trustRows.length > 0
      ? trustRows.reduce((sum, r) => sum + (r.trust_score ?? 0), 0) / trustRows.length
      : 0

    signals.push(`avg_trust_score:${Math.round(avgTrustScore)}`, `at_risk_creators:${atRiskCount}`)

    if (atRiskCount > 10) {
      signals.push(`elevated_at_risk_count:${atRiskCount}`)
    }

    const currentIntegrity = integrityRows[0]?.overall_integrity_score ?? null
    const priorIntegrity = integrityRows[1]?.overall_integrity_score ?? null

    if (currentIntegrity !== null && priorIntegrity !== null) {
      const integrityDrop = priorIntegrity - currentIntegrity
      if (integrityDrop > 0) {
        await emitEvent(
          "trust_governance_degraded",
          { tenantId: "platform", creatorId: "platform", correlationId },
          {
            currentIntegrityScore: Math.round(currentIntegrity),
            priorIntegrityScore: Math.round(priorIntegrity),
            degradation: Math.round(integrityDrop),
            avgTrustScore: Math.round(avgTrustScore),
            atRiskCount,
            snapshotDate: today,
          },
          `trust_governance:platform:${today}`,
        )
        eventsEmitted++
        alertsRaised++
        signals.push(`trust_degraded:drop=${Math.round(integrityDrop)}pts`)
      }
    }

    logger.info("[trust-governance] engine complete", { avgTrustScore: Math.round(avgTrustScore), atRiskCount, eventsEmitted, correlationId })

    return {
      module: "trust-governance",
      eventsEmitted,
      alertsRaised,
      durationMs: Date.now() - start,
      signals,
    }
  } catch (err) {
    logger.error("[trust-governance] engine failed", { error: String(err) })
    return { module: "trust-governance", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
  }
}
