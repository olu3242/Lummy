/**
 * Creator Network Engine — detects network growth effects, referral chains,
 * and creator ecosystem cluster formation.
 *
 * Builds on: src/lib/ecosystem/participation.ts
 * Reads from: creator_referrals, creator_collaborations, creator_profiles
 * Emits:      creator_network_growth_detected, ecosystem_network_acceleration
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { EcosystemIntelligenceRunResult } from "./ecosystem-events"

export async function runCreatorNetworkEngine(): Promise<EcosystemIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("netw")
  const today = new Date().toISOString().split("T")[0]
  const sevenDaysAgo  = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    // Network size: total referral pairs
    const [refRes, collabRes] = await Promise.allSettled([
      supabase.from("creator_referrals").select("referrer_id, referred_id, status, created_at"),
      supabase.from("creator_collaborations").select("initiator_id, partner_id, status"),
    ])

    const referrals     = refRes.status === "fulfilled"
      ? (refRes.value.data ?? []) as { referrer_id: string; referred_id: string; status: string; created_at: string }[]
      : []
    const collaborations = collabRes.status === "fulfilled"
      ? (collabRes.value.data ?? []) as { initiator_id: string; partner_id: string; status: string }[]
      : []

    const newReferrals7d = referrals.filter(r => new Date(r.created_at) >= new Date(sevenDaysAgo))
    const activeCollab   = collaborations.filter(c => c.status === "active")

    const activeNodes = new Set([
      ...referrals.map(r => r.referrer_id),
      ...activeCollab.map(c => c.initiator_id),
      ...activeCollab.map(c => c.partner_id),
    ])

    const totalEdges   = referrals.length + activeCollab.length
    const networkDensity = activeNodes.size > 1
      ? Math.min(1, totalEdges / (activeNodes.size * (activeNodes.size - 1) / 2))
      : 0

    // Network growth acceleration signal
    if (newReferrals7d.length >= 3) {
      await emitEvent("ecosystem_network_acceleration", {
        tenantId: "platform", correlationId,
      }, {
        activeNodes:    activeNodes.size,
        newConnections7d: newReferrals7d.length,
        accelerationSignal: newReferrals7d.length >= 10 ? "viral" : "growing",
        snapshotDate:   today,
      }, `network_accel:${today}`)
      eventsEmitted++
      signals.push(`network_accel:${newReferrals7d.length}new_refs`)
    }

    // Detect high-referral creators → emit network_growth_detected
    const referralCount = new Map<string, number>()
    for (const r of referrals) {
      referralCount.set(r.referrer_id, (referralCount.get(r.referrer_id) ?? 0) + 1)
    }

    for (const [creatorId, count] of referralCount.entries()) {
      if (count >= 3) {
        await emitEvent("creator_network_growth_detected", {
          tenantId: creatorId, creatorId, correlationId,
        }, {
          creatorId,
          referralCount:    count,
          networkDensity,
          snapshotDate:     today,
        }, `creator_network:${creatorId}:${today}`)
        eventsEmitted++
        signals.push(`network:${creatorId}:${count}refs`)
      }
    }

    logger.info("[creator-network] engine complete", {
      activeNodes: activeNodes.size,
      newRefs: newReferrals7d.length,
      eventsEmitted,
      correlationId,
    })
  } catch (err) {
    logger.error("[creator-network] engine failed", { error: String(err) })
  }

  return { module: "creator-network", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals }
}
