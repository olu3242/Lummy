import { createAdminClient } from "@/lib/supabase/server"

export interface NotificationContinuityReport {
  generatedAt: string
  score: number
  last24h: {
    total: number
    unread: number
    unreadRate: number
  }
  staleUnread: number       // unread notifications >7d old
  recentDeliveryGap: boolean // no notifications delivered in last 48h (during active period)
  issues: string[]
  recommendations: string[]
}

export async function runNotificationContinuityAudit(): Promise<NotificationContinuityReport> {
  const supabase = createAdminClient()
  const issues: string[] = []
  const recommendations: string[] = []

  const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString()
  const since48h = new Date(Date.now() - 48 * 3_600_000).toISOString()
  const staleThreshold = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [last24hRes, staleRes, recent48hRes] = await Promise.allSettled([
    supabase
      .from("notifications")
      .select("read", { count: "exact" })
      .gte("created_at", since24h),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false)
      .lte("created_at", staleThreshold),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since48h),
  ])

  const last24hData = last24hRes.status === "fulfilled" ? last24hRes.value.data ?? [] : []
  const last24hTotal = last24hRes.status === "fulfilled" ? (last24hRes.value.count ?? 0) : 0
  const last24hUnread = last24hData.filter((r: Record<string, unknown>) => !r.read).length
  const staleUnread = staleRes.status === "fulfilled" ? (staleRes.value.count ?? 0) : 0
  const recent48h = recent48hRes.status === "fulfilled" ? (recent48hRes.value.count ?? 0) : 0

  const unreadRate = last24hTotal > 0 ? Math.round(last24hUnread / last24hTotal * 100) : 0
  const recentDeliveryGap = recent48h === 0

  if (staleUnread > 20) issues.push(`${staleUnread} notifications unread for >7 days — review notification content and delivery`)
  if (recentDeliveryGap) recommendations.push("No notifications delivered in last 48h — verify cron jobs and milestone triggers are running")
  if (unreadRate > 80) recommendations.push(`Unread rate ${unreadRate}% — notifications may not be reaching creators`)

  const score = Math.max(0, 100
    - (staleUnread > 20 ? 20 : 0)
    - (recentDeliveryGap ? 15 : 0)
    - (unreadRate > 80 ? 10 : 0)
  )

  return {
    generatedAt: new Date().toISOString(),
    score,
    last24h: { total: last24hTotal, unread: last24hUnread, unreadRate },
    staleUnread,
    recentDeliveryGap,
    issues,
    recommendations,
  }
}
