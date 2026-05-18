import { createAdminClient } from "@/lib/supabase/server"

export interface CustomerSegment {
  label: string
  count: number
  totalSpendKobo: number
  avgOrderValueKobo: number
}

export interface CustomerInsights {
  totalCustomers: number
  repeatCustomers: number
  repeatRate: number
  avgOrderValueKobo: number
  totalRevenueKobo: number
  segments: CustomerSegment[]
  topCustomers: Array<{ phone: string; name: string | null; orders: number; totalKobo: number }>
}

export interface CLVTrend {
  month: string
  newCustomers: number
  returningCustomers: number
  avgCLVKobo: number
}

export async function getCreatorCustomerInsights(creatorId: string): Promise<CustomerInsights> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("orders")
    .select("id, customer_phone, customer_name, total_kobo, status, created_at")
    .eq("creator_id", creatorId)
    .in("status", ["paid", "completed", "fulfilled"])

  const orders = (data as {
    id: string; customer_phone: string; customer_name: string | null
    total_kobo: number; status: string; created_at: string
  }[] | null) ?? []

  const customerMap = new Map<string, { name: string | null; orders: number; totalKobo: number }>()
  for (const o of orders) {
    if (!customerMap.has(o.customer_phone)) {
      customerMap.set(o.customer_phone, { name: o.customer_name, orders: 0, totalKobo: 0 })
    }
    const c = customerMap.get(o.customer_phone)!
    c.orders++
    c.totalKobo += o.total_kobo ?? 0
  }

  const customers = Array.from(customerMap.entries())
  const totalCustomers = customers.length
  const repeatCustomers = customers.filter(([, c]) => c.orders > 1).length
  const totalRevenueKobo = customers.reduce((s, [, c]) => s + c.totalKobo, 0)
  const avgOrderValueKobo = orders.length > 0 ? Math.round(totalRevenueKobo / orders.length) : 0
  const repeatRate = totalCustomers > 0 ? Math.round(repeatCustomers / totalCustomers * 100 * 10) / 10 : 0

  // Segments
  const oneTime = customers.filter(([, c]) => c.orders === 1)
  const loyal = customers.filter(([, c]) => c.orders >= 3)
  const occasional = customers.filter(([, c]) => c.orders === 2)
  const highValue = customers.filter(([, c]) => c.totalKobo >= 50_000_00)

  const segmentSummary = (list: typeof customers): { count: number; totalSpendKobo: number; avgOrderValueKobo: number } => {
    const count = list.length
    const totalSpendKobo = list.reduce((s, [, c]) => s + c.totalKobo, 0)
    const totalOrders = list.reduce((s, [, c]) => s + c.orders, 0)
    return { count, totalSpendKobo, avgOrderValueKobo: totalOrders > 0 ? Math.round(totalSpendKobo / totalOrders) : 0 }
  }

  const segments: CustomerSegment[] = [
    { label: "One-time buyers", ...segmentSummary(oneTime) },
    { label: "Occasional (2 orders)", ...segmentSummary(occasional) },
    { label: "Loyal (3+ orders)", ...segmentSummary(loyal) },
    { label: "High-value (₦5k+)", ...segmentSummary(highValue) },
  ]

  const topCustomers = customers
    .sort((a, b) => b[1].totalKobo - a[1].totalKobo)
    .slice(0, 5)
    .map(([phone, c]) => ({ phone, name: c.name, orders: c.orders, totalKobo: c.totalKobo }))

  return {
    totalCustomers,
    repeatCustomers,
    repeatRate,
    avgOrderValueKobo,
    totalRevenueKobo,
    segments,
    topCustomers,
  }
}

export async function getCLVTrend(creatorId: string, months = 6): Promise<CLVTrend[]> {
  const supabase = createAdminClient()
  const since = new Date()
  since.setMonth(since.getMonth() - months)

  const { data } = await supabase
    .from("orders")
    .select("customer_phone, total_kobo, created_at")
    .eq("creator_id", creatorId)
    .in("status", ["paid", "completed", "fulfilled"])
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true })

  const orders = (data as { customer_phone: string; total_kobo: number; created_at: string }[] | null) ?? []

  const monthBuckets = new Map<string, { phones: Set<string>; allPhones: Set<string>; revenue: number; count: number }>()
  const seenBefore = new Set<string>()

  for (const o of orders) {
    const month = o.created_at.slice(0, 7)
    if (!monthBuckets.has(month)) {
      monthBuckets.set(month, { phones: new Set(), allPhones: new Set(), revenue: 0, count: 0 })
    }
    const b = monthBuckets.get(month)!
    b.allPhones.add(o.customer_phone)
    if (seenBefore.has(o.customer_phone)) {
      b.phones.add(o.customer_phone)
    }
    b.revenue += o.total_kobo ?? 0
    b.count++
  }

  // Build seen set per month (customers seen in prior months)
  const sortedMonths = Array.from(monthBuckets.keys()).sort()
  const monthSeenBefore = new Map<string, Set<string>>()
  const cumulativeSeen = new Set<string>()

  for (const o of orders) {
    seenBefore.add(o.customer_phone)
  }

  let runningSeenSet = new Set<string>()
  const result: CLVTrend[] = []

  for (const month of sortedMonths) {
    const b = monthBuckets.get(month)!
    const newCustomers = Array.from(b.allPhones).filter(p => !runningSeenSet.has(p)).length
    const returningCustomers = Array.from(b.allPhones).filter(p => runningSeenSet.has(p)).length
    const avgCLVKobo = b.count > 0 ? Math.round(b.revenue / b.count) : 0

    Array.from(b.allPhones).forEach(p => runningSeenSet.add(p))

    result.push({ month, newCustomers, returningCustomers, avgCLVKobo })
  }

  return result
}

export async function getPlatformCustomerSummary(): Promise<{
  totalUniqueCustomers: number
  avgRepeatRate: number
  platformAvgCLVKobo: number
}> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("orders")
    .select("creator_id, customer_phone, total_kobo")
    .in("status", ["paid", "completed", "fulfilled"])

  const orders = (data as { creator_id: string; customer_phone: string; total_kobo: number }[] | null) ?? []

  const allPhones = new Set(orders.map(o => o.customer_phone))
  const totalUniqueCustomers = allPhones.size

  const creatorCustomers = new Map<string, Set<string>>()
  for (const o of orders) {
    if (!creatorCustomers.has(o.creator_id)) creatorCustomers.set(o.creator_id, new Set())
    creatorCustomers.get(o.creator_id)!.add(o.customer_phone)
  }

  const phoneCounts = new Map<string, number>()
  for (const o of orders) {
    phoneCounts.set(o.customer_phone, (phoneCounts.get(o.customer_phone) ?? 0) + 1)
  }

  const repeatPhones = Array.from(phoneCounts.values()).filter(c => c > 1).length
  const avgRepeatRate = totalUniqueCustomers > 0
    ? Math.round(repeatPhones / totalUniqueCustomers * 100 * 10) / 10
    : 0

  const totalRevenue = orders.reduce((s, o) => s + (o.total_kobo ?? 0), 0)
  const platformAvgCLVKobo = totalUniqueCustomers > 0 ? Math.round(totalRevenue / totalUniqueCustomers) : 0

  return { totalUniqueCustomers, avgRepeatRate, platformAvgCLVKobo }
}
