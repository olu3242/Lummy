import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

export interface AppNotificationRow {
  id: string
  title: string
  body: string
  action_url: string | null
  is_read: boolean
  channel: string
  created_at: string
}

export async function getCreatorNotifications(
  userId: string,
  limit = 20,
): Promise<AppNotificationRow[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, action_url, is_read, channel, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  return (data ?? []) as AppNotificationRow[]
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient()
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  return count ?? 0
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  const supabase = createClient()
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId)
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = createClient()
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)
}

export async function createSystemNotification(
  userId: string,
  title: string,
  body: string,
  actionUrl?: string,
): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    body,
    action_url: actionUrl ?? null,
    channel: "in_app",
  })
}
