import { createClient } from "@/lib/supabase/server"

export interface AnalyticsSummary {
  whatsapp_clicks: number
  storefront_views: number
  orders: number
  revenue_ngn: number
  conversion_rate: number
  top_day: string | null
}

export interface DailyMetricRow {
  date: string
  revenue_ngn: number
  orders_created: number
  storefront_views: number
  whatsapp_clicks: number
}

export interface MonthlyBucket {
  month: string
  revenue: number
  orders: number
  views: number
  aov: number
}

export interface WeeklyBucket {
  day: string
  views: number
  clicks: number
  orders: number
}

function toMonthlyBuckets(rows: DailyMetricRow[]): MonthlyBucket[] {
  const map = new Map<string, { revenue: number; orders: number; views: number }>()
  for (const r of rows) {
    const month = new Date(r.date + "T00:00:00").toLocaleString("en-US", { month: "short" })
    const existing = map.get(month) ?? { revenue: 0, orders: 0, views: 0 }
    map.set(month, {
      revenue: existing.revenue + r.revenue_ngn,
      orders:  existing.orders  + r.orders_created,
      views:   existing.views   + r.storefront_views,
    })
  }
  return Array.from(map.entries()).map(([month, v]) => ({
    month,
    revenue: v.revenue,
    orders:  v.orders,
    views:   v.views,
    aov:     v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
  }))
}

const DAY_ABBRS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function toWeeklyBuckets(rows: DailyMetricRow[]): WeeklyBucket[] {
  const map = new Map<string, { views: number; clicks: number; orders: number }>()
  for (const r of rows) {
    const day = DAY_ABBRS[new Date(r.date + "T00:00:00").getDay()]
    const existing = map.get(day) ?? { views: 0, clicks: 0, orders: 0 }
    map.set(day, {
      views:  existing.views  + r.storefront_views,
      clicks: existing.clicks + r.whatsapp_clicks,
      orders: existing.orders + r.orders_created,
    })
  }
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({
    day,
    ...(map.get(day) ?? { views: 0, clicks: 0, orders: 0 }),
  }))
}

export async function get30DayAnalytics(creatorId: string): Promise<AnalyticsSummary & {
  monthlyData: MonthlyBucket[]
  weeklyData: WeeklyBucket[]
}> {
  const supabase = createClient()
  const start = new Date()
  start.setDate(start.getDate() - 365)

  const { data, error } = await supabase
    .from("creator_metrics_daily")
    .select("date, storefront_views, whatsapp_clicks, orders_created, revenue_ngn")
    .eq("creator_id", creatorId)
    .gte("date", start.toISOString().split("T")[0])
    .order("date", { ascending: true })

  const empty = {
    whatsapp_clicks: 0, storefront_views: 0, orders: 0,
    revenue_ngn: 0, conversion_rate: 0, top_day: null,
    monthlyData: [], weeklyData: [],
  }

  if (error || !data) return empty

  const rows = data as DailyMetricRow[]
  const last30 = rows.filter(r => new Date(r.date) >= new Date(Date.now() - 30 * 86400000))

  const totals = last30.reduce((acc, r) => ({
    whatsapp_clicks:  acc.whatsapp_clicks  + (r.whatsapp_clicks ?? 0),
    storefront_views: acc.storefront_views + (r.storefront_views ?? 0),
    orders:           acc.orders           + (r.orders_created ?? 0),
    revenue_ngn:      acc.revenue_ngn      + (r.revenue_ngn ?? 0),
  }), { whatsapp_clicks: 0, storefront_views: 0, orders: 0, revenue_ngn: 0 })

  const topRow = last30.length > 0
    ? last30.reduce((best, r) => (r.revenue_ngn > best.revenue_ngn ? r : best), last30[0])
    : null

  return {
    ...totals,
    conversion_rate: totals.storefront_views > 0
      ? (totals.orders / totals.storefront_views) * 100
      : 0,
    top_day: topRow?.date ?? null,
    monthlyData: toMonthlyBuckets(rows),
    weeklyData:  toWeeklyBuckets(last30),
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
