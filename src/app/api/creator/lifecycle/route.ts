import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { computeEngagementScore } from "@/lib/creator/engagement"

const ALL_MILESTONES = [
  { key: "first_product",   label: "First Product Added",  icon: "📦", description: "You listed your first product" },
  { key: "five_products",   label: "5 Products Listed",    icon: "🛍️", description: "Build a full catalogue" },
  { key: "first_sale",      label: "First Sale",           icon: "💰", description: "Your first paying customer" },
  { key: "ten_sales",       label: "10 Sales",             icon: "🚀", description: "You're building momentum" },
  { key: "streak_7",        label: "7-Day Streak",         icon: "🔥", description: "7 days active in a row" },
  { key: "ai_power_user",   label: "AI Power User",        icon: "🤖", description: "Used AI tools 20+ times" },
]

function getLifecycleStage(milestones: string[], streakDays: number, score: number): string {
  if (milestones.includes("ten_sales")) return "scaling"
  if (milestones.includes("first_sale")) return "monetizing"
  if (milestones.includes("first_product")) return "building"
  if (score > 0 || streakDays > 0) return "getting_started"
  return "onboarding"
}

async function resolveCreatorId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from("creator_profiles").select("id").eq("user_id", userId).maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const creatorId = await resolveCreatorId(user.id)
  if (!creatorId) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const admin = createAdminClient()
  const [engagementScore, achievedRes] = await Promise.all([
    computeEngagementScore(creatorId),
    admin.from("creator_milestones").select("milestone, achieved_at").eq("creator_id", creatorId),
  ])

  const achieved = (achievedRes.data as { milestone: string; achieved_at: string }[] | null) ?? []
  const achievedSet = new Set(achieved.map(m => m.milestone))
  const achievedMap = new Map(achieved.map(m => [m.milestone, m.achieved_at]))

  const milestones = ALL_MILESTONES.map(m => ({
    ...m,
    achieved: achievedSet.has(m.key),
    achievedAt: achievedMap.get(m.key) ?? null,
  }))

  const achievedKeys = achieved.map(a => a.milestone)
  const lifecycleStage = getLifecycleStage(achievedKeys, engagementScore.streakDays, engagementScore.score)

  const nextMilestone = milestones.find(m => !m.achieved) ?? null

  return NextResponse.json({
    engagement: {
      score: engagementScore.score,
      streakDays: engagementScore.streakDays,
      momentumTrend: engagementScore.momentumTrend,
      lastActiveAt: engagementScore.lastActiveAt,
    },
    milestones,
    achievedCount: achievedSet.size,
    totalMilestones: ALL_MILESTONES.length,
    lifecycleStage,
    nextMilestone,
  })
}
