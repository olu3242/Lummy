import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { verifyCronSecret } from "@/lib/runtime/cron"

export const maxDuration = 120


async function runNotificationCleanup(): Promise<{ ok: boolean; durationMs: number; deleted: number; error?: string }> {
  const start = Date.now()
  const supabase = createAdminClient()

  try {
    // Delete read notifications older than 30 days
    const cutoff30d = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const { data: deleted30d } = await supabase
      .from("notifications")
      .delete()
      .eq("read", true)
      .lt("created_at", cutoff30d)
      .select("id")

    // Delete unread notifications older than 90 days (stale)
    const cutoff90d = new Date(Date.now() - 90 * 86_400_000).toISOString()
    const { data: deleted90d } = await supabase
      .from("notifications")
      .delete()
      .lt("created_at", cutoff90d)
      .select("id")

    // Clean up processed automation events older than 14 days
    const cutoff14d = new Date(Date.now() - 14 * 86_400_000).toISOString()
    void Promise.resolve(
      supabase.from("automation_events")
        .delete()
        .eq("processed", true)
        .lt("processed_at", cutoff14d)
    ).catch(() => {})

    const deleted = ((deleted30d as { id: string }[] | null)?.length ?? 0) +
                    ((deleted90d as { id: string }[] | null)?.length ?? 0)

    return { ok: true, durationMs: Date.now() - start, deleted }
  } catch (err) {
    return { ok: false, durationMs: Date.now() - start, deleted: 0, error: String(err) }
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  logger.info("[cron] notification_cleanup started")
  const result = await runNotificationCleanup()
  logger.info("[cron] notification_cleanup complete", { ok: result.ok, durationMs: result.durationMs, deleted: result.deleted })

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
