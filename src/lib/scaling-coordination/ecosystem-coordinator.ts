import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ScalingCoordinationRunResult } from "./scaling-events"

export async function runEcosystemCoordinator(): Promise<ScalingCoordinationRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("ecosystem")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

    // ── Low-trust creator count ──────────────────────────────────────────────
    let lowTrustCreators = 0
    const { data: trustScores, error: trustErr } = await supabase
      .from("creator_trust_scores")
      .select("creator_id")
      .lt("trust_score", 40)

    if (!trustErr) {
      lowTrustCreators = (trustScores ?? []).length
    }

    // ── Dispute events in last 7d ────────────────────────────────────────────
    const { data: disputeEvents } = await supabase
      .from("automation_events")
      .select("id")
      .eq("event_name", "creator_dispute_risk")
      .gte("created_at", sevenDaysAgo)

    const disputeEventCount = (disputeEvents ?? []).length

    // ── Fraud risk events in last 7d ─────────────────────────────────────────
    const { data: fraudEvents } = await supabase
      .from("automation_events")
      .select("id")
      .eq("event_name", "customer_fraud_risk")
      .gte("created_at", sevenDaysAgo)

    const fraudEventCount = (fraudEvents ?? []).length

    const riskScore = Math.min(100, lowTrustCreators * 2 + disputeEventCount * 5 + fraudEventCount * 10)

    if (riskScore >= 40) {
      const riskType =
        fraudEventCount > 10     ? "widespread_fraud" :
        disputeEventCount > 20   ? "dispute_epidemic" :
        lowTrustCreators > 30    ? "trust_collapse" :
        "churn_cascade"

      const severity =
        riskScore > 70 ? "critical" :
        riskScore > 40 ? "high" :
        "medium"

      await emitEvent("ecosystem_integrity_risk", {
        tenantId: "platform", creatorId: "platform", correlationId,
      }, {
        riskType,
        severity,
        affectedCreators: lowTrustCreators + disputeEventCount,
        riskScore,
        snapshotDate: today,
      }, `ecosystem_integrity:platform:${today}`)
      eventsEmitted++
      signals.push(`ecosystem_risk:${riskType}:score=${riskScore}:${severity}`)
    }

    logger.info("[ecosystem-coordinator] engine complete", { eventsEmitted, correlationId, riskScore })
  } catch (err) {
    logger.error("[ecosystem-coordinator] engine failed", { error: String(err) })
    return { module: "ecosystem-coordinator", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [String(err)] }
  }

  return { module: "ecosystem-coordinator", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
