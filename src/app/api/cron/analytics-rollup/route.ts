import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { verifyCronSecret } from "@/lib/runtime/cron"

export const maxDuration = 300


async function runAnalyticsRollup(): Promise<{ ok: boolean; durationMs: number; processed: number; error?: string }> {
  const start = Date.now()
  const supabase = createAdminClient()

  try {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0]

    // Fetch all published creators
    const { data: creators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(500)

    if (!creators?.length) {
      return { ok: true, durationMs: Date.now() - start, processed: 0 }
    }

    const creatorIds = (creators as { id: string }[]).map(c => c.id)
    let processed = 0

    // For each creator, ensure a metrics_daily row exists for yesterday
    for (const creatorId of creatorIds) {
      const { data: existing } = await supabase
        .from("creator_metrics_daily")
        .select("id")
        .eq("creator_id", creatorId)
        .eq("date", yesterday)
        .maybeSingle()

      if (!existing) {
        // Pull counts from orders and events for yesterday
        const [ordersRes, clicksRes] = await Promise.allSettled([
          supabase.from("orders")
            .select("id, total_amount", { count: "exact", head: false })
            .eq("creator_id", creatorId)
            .eq("payment_status", "paid")
            .gte("created_at", `${yesterday}T00:00:00Z`)
            .lt("created_at", `${yesterday}T23:59:59Z`),
          supabase.from("campaign_attributions")
            .select("id", { count: "exact", head: true })
            .eq("creator_id", creatorId)
            .gte("clicked_at", `${yesterday}T00:00:00Z`)
            .lt("clicked_at", `${yesterday}T23:59:59Z`),
        ])

        const orders = ordersRes.status === "fulfilled" ? (ordersRes.value.data as { id: string; total_amount: number }[] | null) ?? [] : []
        const clickCount = clicksRes.status === "fulfilled" ? (clicksRes.value.count ?? 0) : 0
        const ordersRevenue = orders.reduce((s, o) => s + (o.total_amount ?? 0), 0)

        void Promise.resolve(
          supabase.from("creator_metrics_daily").upsert({
            creator_id: creatorId,
            date: yesterday,
            storefront_views: 0,
            whatsapp_clicks: clickCount,
            orders_completed: orders.length,
            revenue_kobo: ordersRevenue,
          }, { onConflict: "creator_id,date" })
        ).catch(() => {})

        processed++
      }
    }

    return { ok: true, durationMs: Date.now() - start, processed }
  } catch (err) {
    return { ok: false, durationMs: Date.now() - start, processed: 0, error: String(err) }
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  logger.info("[cron] analytics_rollup started")
  const result = await runAnalyticsRollup()
  logger.info("[cron] analytics_rollup complete", { ok: result.ok, durationMs: result.durationMs, processed: result.processed })

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
