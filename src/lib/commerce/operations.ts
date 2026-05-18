import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"

export interface FulfillmentStatus {
  orderId: string
  customerPhone: string
  totalKobo: number
  status: string
  createdAt: string
  fulfilledAt: string | null
  daysPending: number
}

export interface OperationalScore {
  score: number
  grade: "A" | "B" | "C" | "D" | "F"
  signals: { label: string; value: string; ok: boolean }[]
}

export interface CommerceHealthSummary {
  pendingOrders: number
  avgFulfillmentDays: number
  overdueOrders: number
  completionRate: number
  operationalScore: OperationalScore
}

export async function getPendingFulfillments(creatorId: string, overdueOnly = false): Promise<FulfillmentStatus[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from("orders")
    .select("id, customer_phone, total_kobo, status, created_at, updated_at")
    .eq("creator_id", creatorId)
    .in("status", ["paid", "processing"])
    .order("created_at", { ascending: true })

  const { data } = await query

  const orders = (data as {
    id: string; customer_phone: string; total_kobo: number
    status: string; created_at: string; updated_at: string | null
  }[] | null) ?? []

  const now = Date.now()
  const results: FulfillmentStatus[] = orders.map(o => {
    const created = new Date(o.created_at).getTime()
    const daysPending = Math.floor((now - created) / 86_400_000)
    return {
      orderId: o.id,
      customerPhone: o.customer_phone,
      totalKobo: o.total_kobo,
      status: o.status,
      createdAt: o.created_at,
      fulfilledAt: o.updated_at,
      daysPending,
    }
  })

  return overdueOnly ? results.filter(r => r.daysPending >= 3) : results
}

export async function markOrderFulfilled(orderId: string, creatorId: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("orders")
    .update({ status: "fulfilled", updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("creator_id", creatorId)
    .in("status", ["paid", "processing"])

  if (error) {
    logger.error("[commerce] fulfill failed", { orderId, error: error.message })
    return false
  }

  logger.info("[commerce] order fulfilled", { orderId, creatorId })
  return true
}

export async function getCommerceHealthSummary(creatorId: string): Promise<CommerceHealthSummary> {
  const supabase = createAdminClient()
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const { data } = await supabase
    .from("orders")
    .select("id, status, created_at, updated_at")
    .eq("creator_id", creatorId)
    .gte("created_at", since30d)

  const orders = (data as {
    id: string; status: string; created_at: string; updated_at: string | null
  }[] | null) ?? []

  const now = Date.now()
  const pending = orders.filter(o => o.status === "paid" || o.status === "processing")
  const completed = orders.filter(o => o.status === "fulfilled" || o.status === "completed")
  const total = orders.length

  const pendingOrders = pending.length
  const overdueOrders = pending.filter(o => {
    const daysPending = Math.floor((now - new Date(o.created_at).getTime()) / 86_400_000)
    return daysPending >= 3
  }).length

  const completionRate = total > 0 ? Math.round(completed.length / total * 100 * 10) / 10 : 0

  // Avg fulfillment time for completed orders
  const fulfillmentDays = completed
    .filter(o => o.updated_at)
    .map(o => Math.floor((new Date(o.updated_at!).getTime() - new Date(o.created_at).getTime()) / 86_400_000))
  const avgFulfillmentDays = fulfillmentDays.length > 0
    ? Math.round(fulfillmentDays.reduce((s, d) => s + d, 0) / fulfillmentDays.length * 10) / 10
    : 0

  const signals = [
    { label: "No overdue orders", value: `${overdueOrders} overdue`, ok: overdueOrders === 0 },
    { label: "Fast fulfillment (<2 days)", value: `${avgFulfillmentDays}d avg`, ok: avgFulfillmentDays < 2 },
    { label: "High completion rate (>90%)", value: `${completionRate}%`, ok: completionRate >= 90 },
    { label: "Low pending queue (<5)", value: `${pendingOrders} pending`, ok: pendingOrders < 5 },
  ]

  const metCount = signals.filter(s => s.ok).length
  let score = Math.round(metCount / signals.length * 100)
  let grade: OperationalScore["grade"] = "F"
  if (score >= 90) grade = "A"
  else if (score >= 75) grade = "B"
  else if (score >= 60) grade = "C"
  else if (score >= 40) grade = "D"

  return {
    pendingOrders,
    avgFulfillmentDays,
    overdueOrders,
    completionRate,
    operationalScore: { score, grade, signals },
  }
}

export async function getPlatformCommerceOps(): Promise<{
  totalPendingOrders: number
  totalOverdueOrders: number
  platformAvgFulfillmentDays: number
  creatorsWithOverdue: number
}> {
  const supabase = createAdminClient()
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const { data } = await supabase
    .from("orders")
    .select("creator_id, status, created_at, updated_at")
    .gte("created_at", since30d)

  const orders = (data as {
    creator_id: string; status: string; created_at: string; updated_at: string | null
  }[] | null) ?? []

  const now = Date.now()
  const pending = orders.filter(o => o.status === "paid" || o.status === "processing")
  const overdue = pending.filter(o => {
    const daysPending = Math.floor((now - new Date(o.created_at).getTime()) / 86_400_000)
    return daysPending >= 3
  })

  const creatorsWithOverdue = new Set(overdue.map(o => o.creator_id)).size

  const completed = orders.filter(o => o.status === "fulfilled" || o.status === "completed")
  const fulfillmentDays = completed
    .filter(o => o.updated_at)
    .map(o => Math.floor((new Date(o.updated_at!).getTime() - new Date(o.created_at).getTime()) / 86_400_000))
  const platformAvgFulfillmentDays = fulfillmentDays.length > 0
    ? Math.round(fulfillmentDays.reduce((s, d) => s + d, 0) / fulfillmentDays.length * 10) / 10
    : 0

  return {
    totalPendingOrders: pending.length,
    totalOverdueOrders: overdue.length,
    platformAvgFulfillmentDays,
    creatorsWithOverdue,
  }
}

export async function getOrderVelocity(creatorId: string, days = 30): Promise<Array<{ date: string; orders: number; revenueKobo: number }>> {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - days * 86_400_000).toISOString()

  const { data } = await supabase
    .from("orders")
    .select("total_kobo, created_at")
    .eq("creator_id", creatorId)
    .in("status", ["paid", "completed", "fulfilled"])
    .gte("created_at", since)
    .order("created_at", { ascending: true })

  const orders = (data as { total_kobo: number; created_at: string }[] | null) ?? []

  const buckets = new Map<string, { orders: number; revenueKobo: number }>()
  for (const o of orders) {
    const date = o.created_at.slice(0, 10)
    if (!buckets.has(date)) buckets.set(date, { orders: 0, revenueKobo: 0 })
    const b = buckets.get(date)!
    b.orders++
    b.revenueKobo += o.total_kobo ?? 0
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, b]) => ({ date, ...b }))
}
