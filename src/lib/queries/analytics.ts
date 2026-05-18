import { createClient } from "@/lib/supabase/server"

export interface AnalyticsSummary {
  whatsapp_clicks: number
  storefront_views: number
  orders: number
  revenue_ngn: number
  conversion_rate: number
  top_day: string | null
}

export async function get30DayAnalytics(creatorId: string): Promise<AnalyticsSummary> {
  const supabase = createClient()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  const { data, error } = await supabase
    .from("creator_metrics_daily")
    .select("date, storefront_views, whatsapp_clicks, orders_created, revenue_ngn")
    .eq("creator_id", creatorId)
    .gte("date", start.toISOString().split("T")[0])
    .order("date", { ascending: false })

  const empty: AnalyticsSummary = {
    whatsapp_clicks: 0, storefront_views: 0, orders: 0,
    revenue_ngn: 0, conversion_rate: 0, top_day: null,
  }

  if (error || !data) return empty

  const rows = data as Array<{ date: string; storefront_views: number; whatsapp_clicks: number; orders_created: number; revenue_ngn: number }>

  const totals = rows.reduce((acc, r) => ({
    whatsapp_clicks:  acc.whatsapp_clicks  + (r.whatsapp_clicks ?? 0),
    storefront_views: acc.storefront_views + (r.storefront_views ?? 0),
    orders:           acc.orders           + (r.orders_created ?? 0),
    revenue_ngn:      acc.revenue_ngn      + (r.revenue_ngn ?? 0),
  }), { whatsapp_clicks: 0, storefront_views: 0, orders: 0, revenue_ngn: 0 })

  const topRow = rows.reduce((best, r) => (r.revenue_ngn > best.revenue_ngn ? r : best), rows[0])

  return {
    ...totals,
    conversion_rate: totals.storefront_views > 0
      ? (totals.orders / totals.storefront_views) * 100
      : 0,
    top_day: topRow?.date ?? null,
  }
}

// Upsert a daily metrics row — used by WhatsApp tracker and order hooks
export async function upsertDailyMetrics(
  creatorId: string,
  date: string,
  patch: {
    storefront_views?: number
    whatsapp_clicks?: number
    orders_created?: number
    revenue_ngn?: number
    new_leads?: number
    new_customers?: number
    ai_generations_count?: number
  }
): Promise<void> {
  const supabase = createClient()

  // Read existing row first to avoid overwriting
  const { data: existing } = await supabase
    .from("creator_metrics_daily")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("date", date)
    .maybeSingle()

  const row = (existing as Record<string, number> | null) ?? {}

  await supabase
    .from("creator_metrics_daily")
    .upsert({
      creator_id: creatorId,
      date,
      storefront_views:      (row["storefront_views"]      ?? 0) + (patch.storefront_views ?? 0),
      whatsapp_clicks:       (row["whatsapp_clicks"]       ?? 0) + (patch.whatsapp_clicks ?? 0),
      orders_created:        (row["orders_created"]        ?? 0) + (patch.orders_created ?? 0),
      revenue_ngn:           (row["revenue_ngn"]           ?? 0) + (patch.revenue_ngn ?? 0),
      new_leads:             (row["new_leads"]             ?? 0) + (patch.new_leads ?? 0),
      new_customers:         (row["new_customers"]         ?? 0) + (patch.new_customers ?? 0),
      ai_generations_count:  (row["ai_generations_count"]  ?? 0) + (patch.ai_generations_count ?? 0),
    }, { onConflict: "creator_id,date" })
}
