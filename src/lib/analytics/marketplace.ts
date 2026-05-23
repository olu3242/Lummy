/**
 * Marketplace intelligence computation
 * Computes virality scores, benchmarks, and pricing signals from live data
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"

export interface ViralityComputeResult {
  computed: number
  failed: number
  durationMs: number
}

/** Compute virality scores for products with activity in the last 7 days */
export async function computeViralityScores(): Promise<ViralityComputeResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const periodStart = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10)
  const periodEnd   = new Date().toISOString().slice(0, 10)

  // Aggregate whatsapp_clicks + orders per product from analytics_events
  const { data: clickData } = await supabase
    .from("analytics_events")
    .select("product_id, event_type, organization_id")
    .gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
    .not("product_id", "is", null)

  if (!clickData?.length) {
    return { computed: 0, failed: 0, durationMs: Date.now() - start }
  }

  type ClickRow = { product_id: string; event_type: string; organization_id: string | null }

  // Aggregate per product
  const productMap = new Map<string, {
    orgId: string | null
    clicks: number
    orders: number
    views: number
  }>()

  for (const row of clickData as ClickRow[]) {
    if (!row.product_id) continue
    if (!productMap.has(row.product_id)) {
      productMap.set(row.product_id, { orgId: row.organization_id, clicks: 0, orders: 0, views: 0 })
    }
    const p = productMap.get(row.product_id)!
    if (row.event_type === "whatsapp_click")   p.clicks++
    if (row.event_type === "order_completed")  p.orders++
    if (row.event_type === "product_view")     p.views++
  }

  let computed = 0
  let failed = 0

  for (const [productId, stats] of productMap) {
    try {
      const conversionRate = stats.clicks > 0 ? stats.orders / stats.clicks : 0
      // Virality score: weighted sum of engagement signals
      const score = Math.min(
        100,
        (stats.clicks * 2) + (stats.orders * 10) + (stats.views * 0.5) + (conversionRate * 30),
      )

      await supabase.from("viral_products").upsert({
        product_id:       productId,
        organization_id:  stats.orgId,
        virality_score:   Math.round(score * 100) / 100,
        whatsapp_clicks:  stats.clicks,
        orders_count:     stats.orders,
        views_count:      stats.views,
        conversion_rate:  conversionRate,
        computed_at:      new Date().toISOString(),
        period_start:     periodStart,
        period_end:       periodEnd,
      }, { onConflict: "product_id,period_start" })
      computed++
    } catch {
      failed++
    }
  }

  logger.info("[marketplace] virality computed", { computed, failed, durationMs: Date.now() - start })
  return { computed, failed, durationMs: Date.now() - start }
}

/** Snapshot creator performance for benchmarking */
export async function snapshotCreatorPerformance(): Promise<{ snapped: number; durationMs: number }> {
  const start = Date.now()
  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: creators } = await supabase
    .from("creator_profiles")
    .select("id, organization_id, niche")
    .limit(500)

  if (!creators?.length) return { snapped: 0, durationMs: Date.now() - start }

  let snapped = 0
  for (const c of creators as { id: string; organization_id?: string; niche?: string }[]) {
    try {
      // Revenue last 30 days
      const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("creator_id", c.id)
        .eq("status", "paid")
        .gte("created_at", since30d)

      const revenue = (orders ?? []).reduce((s, o: { total_amount?: number }) => s + Number(o.total_amount ?? 0), 0)
      const orderCount = orders?.length ?? 0

      const { count: productCount } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", c.id)
        .eq("is_active", true)

      await supabase.from("creator_performance_snapshots").upsert({
        creator_id:      c.id,
        organization_id: c.organization_id ?? null,
        snapshot_date:   today,
        revenue_kobo:    revenue,
        order_count:     orderCount,
        product_count:   productCount ?? 0,
        niche:           c.niche ?? null,
      }, { onConflict: "creator_id,snapshot_date" })
      snapped++
    } catch { /* best-effort */ }
  }

  return { snapped, durationMs: Date.now() - start }
}
