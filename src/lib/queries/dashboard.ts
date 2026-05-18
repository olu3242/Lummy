import { createClient } from "@/lib/supabase/server"
import type { StatCard } from "@/data/mock/dashboard"
import { formatCurrency } from "@/lib/utils"

export interface DashboardMetrics {
  stats: StatCard[]
  revenueByMonth: { month: string; revenue: number; orders: number }[]
  topProducts: { name: string; revenue: number; orders: number }[]
}

// Fetch 30-day rolling metrics from creator_metrics_daily
export async function getCreatorMetrics(creatorId: string): Promise<DashboardMetrics | null> {
  const supabase = createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: metrics, error } = await supabase
    .from("creator_metrics_daily")
    .select("*")
    .eq("creator_id", creatorId)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: true })

  if (error) {
    console.error("[getCreatorMetrics]", error.message)
    return null
  }

  if (!metrics || metrics.length === 0) return null

  const rows = metrics as Array<{
    date: string
    storefront_views: number
    whatsapp_clicks: number
    conversions: number
    orders_created: number
    revenue_ngn: number
    new_leads: number
    new_customers: number
    ai_generations_count: number
  }>

  const totalRevenue = rows.reduce((s, r) => s + (r.revenue_ngn ?? 0), 0)
  const totalOrders  = rows.reduce((s, r) => s + (r.orders_created ?? 0), 0)
  const totalViews   = rows.reduce((s, r) => s + (r.storefront_views ?? 0), 0)
  const totalWA      = rows.reduce((s, r) => s + (r.whatsapp_clicks ?? 0), 0)
  const convRate     = totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(2) : "0.00"

  const stats: StatCard[] = [
    {
      id: "revenue",
      label: "Total Revenue (30d)",
      value: formatCurrency(totalRevenue / 100), // stored in kobo
      rawValue: totalRevenue,
      change: "+live",
      trend: "up",
      icon: "Wallet",
      color: "text-brand-green",
      bg: "bg-brand-green/10",
    },
    {
      id: "orders",
      label: "Total Orders (30d)",
      value: totalOrders.toLocaleString(),
      rawValue: totalOrders,
      change: "+live",
      trend: "up",
      icon: "ShoppingBag",
      color: "text-brand-purple",
      bg: "bg-brand-purple/10",
    },
    {
      id: "views",
      label: "Store Views (30d)",
      value: totalViews.toLocaleString(),
      rawValue: totalViews,
      change: "+live",
      trend: "up",
      icon: "Eye",
      color: "text-brand-coral",
      bg: "bg-brand-coral/10",
    },
    {
      id: "whatsapp",
      label: "WhatsApp Clicks (30d)",
      value: totalWA.toLocaleString(),
      rawValue: totalWA,
      change: `${convRate}% conv`,
      trend: "up",
      icon: "TrendingUp",
      color: "text-[#25D366]",
      bg: "bg-[#25D366]/10",
    },
  ]

  // Group by month for revenue chart
  const byMonth: Record<string, { revenue: number; orders: number }> = {}
  rows.forEach(r => {
    const m = r.date.slice(0, 7) // "YYYY-MM"
    if (!byMonth[m]) byMonth[m] = { revenue: 0, orders: 0 }
    byMonth[m].revenue += r.revenue_ngn ?? 0
    byMonth[m].orders  += r.orders_created ?? 0
  })

  const revenueByMonth = Object.entries(byMonth).map(([month, v]) => ({
    month: new Intl.DateTimeFormat("en-NG", { month: "short" }).format(new Date(`${month}-01`)),
    revenue: Math.round(v.revenue / 100),
    orders: v.orders,
  }))

  return { stats, revenueByMonth, topProducts: [] }
}

// Fetch authenticated creator ID from session
export async function getAuthCreatorId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  return (data as { id: string } | null)?.id ?? null
}
