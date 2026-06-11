/**
 * Creator Network Scaling Engine — tracks creator acquisition velocity via
 * referral network effects and emits network scaling signals.
 *
 * Reads from: creator_profiles, creator_referrals
 * Emits:      creator_network_scaling (via expansion events)
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ExpansionIntelligenceRunResult } from "./expansion-events"

export async function runCreatorNetworkScalingEngine(): Promise<ExpansionIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("netscale")
  const today = new Date().toISOString().split("T")[0]
  const sevenDaysAgo  = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString()
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const [newCreatorsRes, referralsRes] = await Promise.allSettled([
      supabase.from("creator_profiles")
        .select("id, created_at")
        .gte("created_at", sevenDaysAgo),
      supabase.from("creator_referrals")
        .select("referrer_id, referred_id, status, created_at"),
    ])

    const newCreators7d = newCreatorsRes.status === "fulfilled"
      ? (newCreatorsRes.value.data ?? []) as { id: string; created_at: string }[]
      : []
    const referrals = referralsRes.status === "fulfilled"
      ? (referralsRes.value.data ?? []) as { referrer_id: string; referred_id: string; status: string; created_at: string }[]
      : []

    const newRef7d  = referrals.filter(r => new Date(r.created_at) >= new Date(sevenDaysAgo)).length
    const newRef14d = referrals.filter(r => new Date(r.created_at) >= new Date(fourteenDaysAgo)).length
    const growthRate7d = newRef14d > 0 ? (newRef7d * 2 - newRef14d) / newRef14d : 0

    // Top referrers who drive most creator acquisition
    const topReferrers = new Map<string, number>()
    for (const r of referrals.filter(r => r.status === "converted")) {
      topReferrers.set(r.referrer_id, (topReferrers.get(r.referrer_id) ?? 0) + 1)
    }
    const top5Referrers = [...topReferrers.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    const networkSize = new Set([
      ...referrals.map(r => r.referrer_id),
      ...referrals.map(r => r.referred_id),
    ]).size

    const networkDensity = networkSize > 1
      ? Math.min(1, referrals.length / (networkSize * (networkSize - 1) / 2))
      : 0

    if (newCreators7d.length >= 1 || newRef7d >= 1) {
      await emitEvent("creator_network_scaling", {
        tenantId: "platform", correlationId,
      }, {
        networkSize,
        growthRate7d,
        topReferrers:   top5Referrers,
        networkDensity,
        snapshotDate:   today,
      }, `network_scaling:${today}`)
      eventsEmitted++
      signals.push(`network:size${networkSize}:refs${newRef7d}:growth${(growthRate7d * 100).toFixed(0)}%`)
    }

    logger.info("[network-scaling] engine complete", { networkSize, newRef7d, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[network-scaling] engine failed", { error: String(err) })
  }

  return { module: "creator-network-scaling", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals }
}
