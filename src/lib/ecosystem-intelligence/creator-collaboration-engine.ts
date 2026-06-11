/**
 * Creator Collaboration Engine — identifies collaboration opportunities between
 * creators with complementary niches or overlapping audiences.
 *
 * Builds on: src/lib/collaboration/index.ts (CollaborationInvite types)
 * Reads from: creator_profiles, creator_performance_snapshots, creator_collaborations
 * Emits:      creator_collaboration_opportunity
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { EcosystemIntelligenceRunResult } from "./ecosystem-events"

export async function runCreatorCollaborationEngine(limit = 100): Promise<EcosystemIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("collab")
  const today = new Date().toISOString().split("T")[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    // Get growing creators by niche/category for cross-promotion pairing
    const [profilesRes, perfRes] = await Promise.allSettled([
      supabase.from("creator_profiles")
        .select("id, niche, handle")
        .eq("is_published", true)
        .not("niche", "is", null)
        .limit(limit),
      supabase.from("creator_performance_snapshots")
        .select("creator_id, order_count, revenue_kobo")
        .gte("snapshot_date", thirtyDaysAgo)
        .order("revenue_kobo", { ascending: false })
        .limit(limit * 10),
    ])

    const profiles = profilesRes.status === "fulfilled"
      ? (profilesRes.value.data ?? []) as { id: string; niche: string; handle: string }[]
      : []
    const perf = perfRes.status === "fulfilled"
      ? (perfRes.value.data ?? []) as { creator_id: string; order_count: number; revenue_kobo: number }[]
      : []

    // Aggregate performance per creator
    const perfMap = new Map<string, { orders: number; revenue: number }>()
    for (const p of perf) {
      const c = perfMap.get(p.creator_id) ?? { orders: 0, revenue: 0 }
      c.orders  += p.order_count
      c.revenue += p.revenue_kobo
      perfMap.set(p.creator_id, c)
    }

    // Existing collaborations to avoid duplicates
    const { data: existingCollab } = await supabase
      .from("creator_collaborations")
      .select("initiator_id, partner_id")
    const existingPairs = new Set(
      ((existingCollab ?? []) as { initiator_id: string; partner_id: string }[])
        .flatMap(c => [`${c.initiator_id}:${c.partner_id}`, `${c.partner_id}:${c.initiator_id}`])
    )

    // Group creators by niche
    const byNiche = new Map<string, string[]>()
    for (const p of profiles) {
      if (!byNiche.has(p.niche)) byNiche.set(p.niche, [])
      byNiche.get(p.niche)!.push(p.id)
    }

    // Within each niche: pair top performer with growing creator for cross-promotion
    for (const [niche, creatorIds] of byNiche.entries()) {
      if (creatorIds.length < 2) continue

      // Sort by revenue in niche
      const sorted = creatorIds
        .map(id => ({ id, ...(perfMap.get(id) ?? { orders: 0, revenue: 0 }) }))
        .sort((a, b) => b.revenue - a.revenue)

      const top = sorted[0]
      const growing = sorted.slice(1).find(c => c.orders >= 1 && c.revenue >= 10_000_00)

      if (!top || !growing) continue
      if (existingPairs.has(`${top.id}:${growing.id}`)) continue

      await emitEvent("creator_collaboration_opportunity", {
        tenantId: top.id, creatorId: top.id, correlationId,
      }, {
        initiatorCreatorId: top.id,
        partnerCreatorId:   growing.id,
        niche,
        collaborationType:  "cross_promotion",
        estimatedRevenueKobo: Math.round((top.revenue + growing.revenue) * 0.1),
        snapshotDate:       today,
      }, `collab_opp:${top.id}:${growing.id}:${today}`)

      eventsEmitted++
      signals.push(`collab:${niche}:${top.id}->${growing.id}`)
    }

    logger.info("[creator-collaboration] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[creator-collaboration] engine failed", { error: String(err) })
  }

  return { module: "creator-collaboration", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals }
}
