import { createAdminClient } from "@/lib/supabase/server"

export interface InboxMessage {
  id: string
  creatorId: string
  createdAt: string
  isRead: boolean
  isFollowedUp: boolean
  creatorNote: string | null
  followedUpAt: string | null
  // From metadata JSONB
  senderPhone: string | null
  senderName: string | null
  messageBody: string | null
  messageType: string | null
  waMessageId: string | null
  phoneNumberId: string | null
  campaignId: string | null
  attributionSource: string | null
}

function rowToMessage(row: Record<string, unknown>): InboxMessage {
  const meta = (row.metadata ?? {}) as Record<string, unknown>
  return {
    id: row.id as string,
    creatorId: row.creator_id as string,
    createdAt: row.created_at as string,
    isRead: row.is_read as boolean ?? true,
    isFollowedUp: row.is_followed_up as boolean ?? false,
    creatorNote: row.creator_note as string | null,
    followedUpAt: row.followed_up_at as string | null,
    senderPhone: meta.from as string | null ?? null,
    senderName: meta.sender_name as string | null ?? null,
    messageBody: meta.message_body as string | null ?? null,
    messageType: meta.message_type as string | null ?? null,
    waMessageId: meta.wa_message_id as string | null ?? null,
    phoneNumberId: meta.phone_number_id as string | null ?? null,
    campaignId: row.campaign_id as string | null,
    attributionSource: (meta.attribution_source as string | null) ?? (row.campaign_id ? "campaign" : null),
  }
}

export type InboxFilter = "all" | "unread" | "followed_up"

export async function getCreatorInbox(
  creatorId: string,
  opts: { filter?: InboxFilter; page?: number; pageSize?: number } = {}
): Promise<{ messages: InboxMessage[]; total: number; unreadCount: number }> {
  const supabase = createAdminClient()
  const { filter = "all", page = 1, pageSize = 20 } = opts
  const from = (page - 1) * pageSize

  let query = supabase
    .from("whatsapp_events")
    .select("*", { count: "exact" })
    .eq("creator_id", creatorId)
    .eq("event_type", "conversation")
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1)

  if (filter === "unread") query = query.eq("is_read", false)
  if (filter === "followed_up") query = query.eq("is_followed_up", true)

  const { data, count } = await query

  const { count: unreadCount } = await supabase
    .from("whatsapp_events")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", creatorId)
    .eq("event_type", "conversation")
    .eq("is_read", false)

  const messages = (data ?? []).map(r => rowToMessage(r as Record<string, unknown>))
  return { messages, total: count ?? 0, unreadCount: unreadCount ?? 0 }
}

export async function markMessageRead(creatorId: string, eventId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("whatsapp_events")
    .update({ is_read: true })
    .eq("id", eventId)
    .eq("creator_id", creatorId)  // multi-tenant safety
  return !error
}

export async function markMessageFollowedUp(
  creatorId: string,
  eventId: string,
  note?: string
): Promise<boolean> {
  const supabase = createAdminClient()
  const patch: Record<string, unknown> = {
    is_followed_up: true,
    followed_up_at: new Date().toISOString(),
    is_read: true,
  }
  if (note !== undefined) patch.creator_note = note.slice(0, 500)

  const { error } = await supabase
    .from("whatsapp_events")
    .update(patch)
    .eq("id", eventId)
    .eq("creator_id", creatorId)
  return !error
}

export interface InboxStats {
  totalConversations: number
  unread: number
  followedUp: number
  last7dCount: number
  repeatSenders: number
  topSenders: Array<{ phone: string; name: string | null; count: number; lastAt: string }>
}

export async function getInboxStats(creatorId: string): Promise<InboxStats> {
  const supabase = createAdminClient()
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [allRes, unreadRes, followedRes, last7dRes, allMsgsRes] = await Promise.allSettled([
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("creator_id", creatorId).eq("event_type", "conversation"),
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("creator_id", creatorId).eq("event_type", "conversation").eq("is_read", false),
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("creator_id", creatorId).eq("event_type", "conversation").eq("is_followed_up", true),
    supabase.from("whatsapp_events").select("id", { count: "exact", head: true }).eq("creator_id", creatorId).eq("event_type", "conversation").gte("created_at", since7d),
    supabase.from("whatsapp_events").select("metadata, created_at").eq("creator_id", creatorId).eq("event_type", "conversation").order("created_at", { ascending: false }).limit(200),
  ])

  // Compute repeat senders from metadata
  const msgs = allMsgsRes.status === "fulfilled" ? (allMsgsRes.value.data ?? []) as Array<{ metadata: Record<string, unknown>; created_at: string }> : []
  const senderMap = new Map<string, { name: string | null; count: number; lastAt: string }>()
  for (const msg of msgs) {
    const phone = msg.metadata?.from as string | null
    if (!phone) continue
    const existing = senderMap.get(phone)
    if (existing) {
      existing.count++
    } else {
      senderMap.set(phone, { name: msg.metadata?.sender_name as string | null ?? null, count: 1, lastAt: msg.created_at })
    }
  }
  const repeatSenders = Array.from(senderMap.values()).filter(s => s.count > 1).length
  const topSenders = Array.from(senderMap.entries())
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([phone, v]) => ({ phone, name: v.name, count: v.count, lastAt: v.lastAt }))

  return {
    totalConversations: allRes.status === "fulfilled" ? (allRes.value.count ?? 0) : 0,
    unread: unreadRes.status === "fulfilled" ? (unreadRes.value.count ?? 0) : 0,
    followedUp: followedRes.status === "fulfilled" ? (followedRes.value.count ?? 0) : 0,
    last7dCount: last7dRes.status === "fulfilled" ? (last7dRes.value.count ?? 0) : 0,
    repeatSenders,
    topSenders,
  }
}
