import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import {
  getCreatorNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/queries/notifications"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50)

  const [notifications, unreadCount] = await Promise.all([
    getCreatorNotifications(user.id, limit),
    getUnreadCount(user.id),
  ])

  return NextResponse.json({ notifications, unreadCount })
}

const patchSchema = z.object({
  id: z.string().uuid().optional(),  // omit to mark all
  read: z.boolean().default(true),
})

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  if (parsed.data.id) {
    await markNotificationRead(user.id, parsed.data.id)
  } else {
    await markAllNotificationsRead(user.id)
  }

  return NextResponse.json({ ok: true })
}
