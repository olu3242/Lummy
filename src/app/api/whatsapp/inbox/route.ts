import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getCreatorInbox, markMessageRead, markMessageFollowedUp, getInboxStats, type InboxFilter } from "@/lib/whatsapp/inbox"

export const dynamic = "force-dynamic"

async function getCreatorId(userId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

async function getCreatorProfile(creatorId: string): Promise<{ handle: string; whatsappNumber: string | null } | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("creator_profiles")
    .select("handle, whatsapp_number")
    .eq("id", creatorId)
    .maybeSingle()
  if (!data) return null
  const row = data as { handle: string; whatsapp_number: string | null }
  return { handle: row.handle, whatsappNumber: row.whatsapp_number }
}

// GET /api/whatsapp/inbox?filter=all|unread|followed_up&page=1
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const creatorId = await getCreatorId(user.id)
  if (!creatorId) return NextResponse.json({ error: "Creator profile not found" }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const filter  = (searchParams.get("filter") ?? "all") as InboxFilter
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const withStats = searchParams.get("stats") === "true"

  const [inbox, stats, profile] = await Promise.allSettled([
    getCreatorInbox(creatorId, { filter, page }),
    withStats ? getInboxStats(creatorId) : Promise.resolve(null),
    getCreatorProfile(creatorId),
  ])

  return NextResponse.json({
    ...(inbox.status === "fulfilled" ? inbox.value : { messages: [], total: 0, unreadCount: 0 }),
    stats: stats.status === "fulfilled" ? stats.value : null,
    creatorProfile: profile.status === "fulfilled" ? profile.value : null,
  })
}

const patchSchema = z.object({
  eventId: z.string().uuid(),
  action: z.enum(["read", "follow_up"]),
  note: z.string().max(500).optional(),
})

// PATCH /api/whatsapp/inbox — mark read or followed up
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const creatorId = await getCreatorId(user.id)
  if (!creatorId) return NextResponse.json({ error: "Creator profile not found" }, { status: 404 })

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  const { eventId, action, note } = parsed.data
  let ok = false

  if (action === "read") {
    ok = await markMessageRead(creatorId, eventId)
  } else if (action === "follow_up") {
    ok = await markMessageFollowedUp(creatorId, eventId, note)
  }

  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Update failed" }, { status: 500 })
}
