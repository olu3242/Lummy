import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { recordEngagementEvent, checkAndAwardMilestones, computeEngagementScore } from "@/lib/creator/engagement"
import type { EngagementEventType } from "@/lib/creator/engagement"

const EventSchema = z.object({
  eventType: z.enum([
    "daily_login", "product_added", "product_published", "storefront_customized",
    "order_received", "sale_completed", "whatsapp_click", "ai_used",
    "streak_milestone", "milestone_achieved",
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

async function resolveCreatorId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from("creator_profiles").select("id").eq("user_id", userId).maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = EventSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const creatorId = await resolveCreatorId(user.id)
  if (!creatorId) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  await recordEngagementEvent(creatorId, parsed.data.eventType as EngagementEventType, parsed.data.metadata ?? {})

  const score = await computeEngagementScore(creatorId)
  const newMilestones = await checkAndAwardMilestones(creatorId, score.streakDays)

  return NextResponse.json({ ok: true, score: score.score, streakDays: score.streakDays, newMilestones })
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const creatorId = await resolveCreatorId(user.id)
  if (!creatorId) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const score = await computeEngagementScore(creatorId)
  return NextResponse.json(score)
}
