import { createAdminClient } from "@/lib/supabase/server"
import { dispatchAutomation } from "@/lib/automation/triggers"

export type EngagementEventType =
  | "daily_login"
  | "product_added"
  | "product_published"
  | "storefront_customized"
  | "order_received"
  | "sale_completed"
  | "whatsapp_click"
  | "ai_used"
  | "streak_milestone"
  | "milestone_achieved"

export interface EngagementScore {
  creatorId: string
  score: number           // 0-100
  streakDays: number
  totalEvents: number
  lastActiveAt: string | null
  momentumTrend: "rising" | "stable" | "declining"
}

export async function recordEngagementEvent(
  creatorId: string,
  eventType: EngagementEventType,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase = createAdminClient()
  void Promise.resolve(
    supabase.from("creator_engagement_events").insert({
      creator_id: creatorId,
      event_type: eventType,
      metadata,
      occurred_at: new Date().toISOString(),
    })
  ).catch(() => {})
}

export async function computeEngagementScore(creatorId: string): Promise<EngagementScore> {
  const supabase = createAdminClient()
  const since14d = new Date(Date.now() - 14 * 86_400_000).toISOString()
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [recent14, recent30, allTime] = await Promise.allSettled([
    supabase.from("creator_engagement_events").select("event_type, occurred_at").eq("creator_id", creatorId).gte("occurred_at", since14d).order("occurred_at", { ascending: false }),
    supabase.from("creator_engagement_events").select("event_type, occurred_at").eq("creator_id", creatorId).gte("occurred_at", since30d),
    supabase.from("creator_engagement_events").select("occurred_at").eq("creator_id", creatorId).order("occurred_at", { ascending: false }).limit(1),
  ])

  const events14 = recent14.status === "fulfilled" ? (recent14.value.data as { event_type: string; occurred_at: string }[] | null) ?? [] : []
  const events30 = recent30.status === "fulfilled" ? (recent30.value.data as { event_type: string; occurred_at: string }[] | null) ?? [] : []
  const lastEvent = allTime.status === "fulfilled" ? (allTime.value.data as { occurred_at: string }[] | null)?.[0] : null

  // Compute streak (consecutive active days in last 14d)
  const activeDays = new Set(events14.map(e => e.occurred_at.split("T")[0]))
  let streakDays = 0
  for (let i = 0; i < 14; i++) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().split("T")[0]
    if (activeDays.has(d)) streakDays++
    else break
  }

  // Score: weighted event types
  const WEIGHTS: Record<string, number> = {
    sale_completed: 15, order_received: 10, product_published: 8,
    product_added: 5, storefront_customized: 5, ai_used: 3,
    whatsapp_click: 3, daily_login: 2, streak_milestone: 10, milestone_achieved: 10,
  }
  let score = 0
  for (const e of events14) {
    score += WEIGHTS[e.event_type] ?? 1
  }
  score = Math.min(100, score)

  // Momentum: compare 14d to prior 14d
  const first14Count = events14.length
  const prior14Count = events30.filter(e => {
    const d = new Date(e.occurred_at).getTime()
    return d < new Date(since14d).getTime()
  }).length

  const momentumTrend: EngagementScore["momentumTrend"] =
    first14Count > prior14Count * 1.2 ? "rising" :
    first14Count < prior14Count * 0.8 ? "declining" : "stable"

  return {
    creatorId,
    score,
    streakDays,
    totalEvents: events30.length,
    lastActiveAt: lastEvent?.occurred_at ?? null,
    momentumTrend,
  }
}

// Milestone definitions — checked after key events
const MILESTONES: Array<{ key: string; label: string; check: (counts: Record<string, number>) => boolean }> = [
  { key: "first_product", label: "First Product Added", check: c => (c.product_added ?? 0) >= 1 },
  { key: "five_products", label: "5 Products Listed", check: c => (c.product_added ?? 0) >= 5 },
  { key: "first_sale", label: "First Sale", check: c => (c.sale_completed ?? 0) >= 1 },
  { key: "ten_sales", label: "10 Sales", check: c => (c.sale_completed ?? 0) >= 10 },
  { key: "streak_7", label: "7-Day Streak", check: c => (c._streak ?? 0) >= 7 },
  { key: "ai_power_user", label: "AI Power User", check: c => (c.ai_used ?? 0) >= 20 },
]

export async function checkAndAwardMilestones(creatorId: string, streakDays: number): Promise<string[]> {
  const supabase = createAdminClient()

  const [countsRes, existingRes] = await Promise.allSettled([
    supabase.from("creator_engagement_events")
      .select("event_type")
      .eq("creator_id", creatorId),
    supabase.from("creator_milestones")
      .select("milestone")
      .eq("creator_id", creatorId),
  ])

  const counts: Record<string, number> = { _streak: streakDays }
  if (countsRes.status === "fulfilled" && countsRes.value.data) {
    for (const row of countsRes.value.data as { event_type: string }[]) {
      counts[row.event_type] = (counts[row.event_type] ?? 0) + 1
    }
  }

  const existing = new Set(
    existingRes.status === "fulfilled"
      ? (existingRes.value.data as { milestone: string }[]).map(r => r.milestone)
      : []
  )

  const newMilestones: string[] = []
  for (const m of MILESTONES) {
    if (!existing.has(m.key) && m.check(counts)) {
      newMilestones.push(m.label)
      // Persist milestone
      void Promise.resolve(
        supabase.from("creator_milestones").upsert(
          { creator_id: creatorId, milestone: m.key, achieved_at: new Date().toISOString() },
          { onConflict: "creator_id,milestone", ignoreDuplicates: true }
        )
      ).catch(() => {})

      // Fire celebration automation
      dispatchAutomation({
        name: "ai_generation_completed", // reuse closest event for notification
        creatorId,
        payload: { milestone: m.key, label: m.label },
        idempotencyKey: `milestone:${m.key}:${creatorId}`,
      })
    }
  }

  return newMilestones
}
