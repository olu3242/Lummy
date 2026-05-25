/**
 * Weekly digest cron — runs every Monday at 08:00 WAT (07:00 UTC)
 * Emits weekly_digest_requested events for all active creators
 * Feature-flagged: weekly_digest_enabled must be true
 */

import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { verifyCronSecret } from "@/lib/runtime/cron"
import { isEnabled } from "@/lib/flags/feature-flags"
import { dispatchAutomation } from "@/lib/automation/triggers"

export const maxDuration = 300


export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const flagEnabled = await isEnabled("weekly_digest_enabled")
  if (!flagEnabled) {
    logger.info("[cron] weekly_digest: disabled by feature flag")
    return NextResponse.json({ ok: true, skipped: true, reason: "weekly_digest_enabled flag is off" })
  }

  const start = Date.now()
  const supabase = createAdminClient()

  // Fetch all active creators (has sales in last 30 days or published)
  const { data: creators, error } = await supabase
    .from("creator_profiles")
    .select("id, organization_id")
    .eq("is_published", true)
    .limit(500)

  if (error) {
    logger.error("[cron] weekly_digest: failed to fetch creators", { error: error.message })
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  let dispatched = 0
  let failed = 0

  for (const creator of (creators ?? []) as { id: string; organization_id?: string }[]) {
    try {
      const week = Math.floor(Date.now() / (7 * 86_400_000))
      await dispatchAutomation({
        name: "weekly_digest_requested",
        creatorId: creator.id,
        payload: {
          tenantId: creator.organization_id ?? creator.id,
          weekNumber: week,
        },
        idempotencyKey: `weekly_digest:${creator.id}:week-${week}`,
      })
      dispatched++
    } catch {
      failed++
    }
  }

  const durationMs = Date.now() - start
  logger.info("[cron] weekly_digest complete", { dispatched, failed, durationMs })
  return NextResponse.json({ ok: true, dispatched, failed, durationMs })
}
