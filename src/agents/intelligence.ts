// Agent Intelligence Layer
// Real SQL-based trend detection, anomaly detection, opportunity scoring

import { createAdminClient } from '@/lib/supabase/server'

export interface TrendAnalysis {
  metric: string
  current: number
  previous: number
  direction: 'improving' | 'stable' | 'declining'
  changePercent: number
  confidence: number
}

export interface AnomalyResult {
  detected: boolean
  type: string
  severity: 'info' | 'warning' | 'critical'
  value: number
  threshold: number
  description: string
}

export interface RevenuePipeline {
  totalRevenue: number
  totalOrders: number
  paidOrders: number
  pendingOrders: number
  paymentSuccessRate: number
  avgOrderValue: number
  revenueThisMonth: number
  revenuePrevMonth: number
  trend: 'improving' | 'stable' | 'declining'
}

export interface ActivationFunnel {
  hasStorefront: boolean
  hasProducts: boolean
  hasFirstOrder: boolean
  hasFirstPaidOrder: boolean
  hasPayoutAccount: boolean
  completionPct: number
  nextStep: string
}

export interface StoreHealthScore {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  components: { label: string; score: number; maxScore: number; note: string }[]
}

export interface CreatorSuccessScore {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  revenue: number
  orders: number
  growth: number
  paymentSuccessRate: number
}

// ── Revenue Analysis ──────────────────────────────────────────────────────────

export async function analyzeRevenueTrend(orgId: string): Promise<TrendAnalysis> {
  const admin = createAdminClient()
  const now = new Date()
  const s7 = new Date(now.getTime() - 7 * 86400000).toISOString()
  const s14 = new Date(now.getTime() - 14 * 86400000).toISOString()

  const { data } = await admin
    .from('payments')
    .select('amount, created_at')
    .eq('organization_id', orgId)
    .eq('status', 'succeeded')
    .gte('created_at', s14)

  const rows = data ?? []
  const current = rows.filter(r => r.created_at >= s7).reduce((s, r) => s + Number(r.amount), 0)
  const previous = rows.filter(r => r.created_at < s7).reduce((s, r) => s + Number(r.amount), 0)
  const changePercent = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0)

  return {
    metric: 'revenue_7d',
    current,
    previous,
    direction: changePercent > 5 ? 'improving' : changePercent < -5 ? 'declining' : 'stable',
    changePercent: Math.round(changePercent * 10) / 10,
    confidence: rows.length >= 2 ? 0.85 : 0.60,
  }
}

export async function getRevenuePipeline(orgId: string): Promise<RevenuePipeline> {
  const admin = createAdminClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [payments, orders] = await Promise.all([
    admin.from('payments').select('amount, status, created_at').eq('organization_id', orgId),
    admin.from('orders').select('status, amount').eq('organization_id', orgId),
  ])

  const allPayments = payments.data ?? []
  const allOrders = orders.data ?? []

  const succeeded = allPayments.filter(p => p.status === 'succeeded')
  const totalRevenue = succeeded.reduce((s, p) => s + Number(p.amount), 0)
  const revenueThisMonth = succeeded.filter(p => p.created_at >= startOfMonth).reduce((s, p) => s + Number(p.amount), 0)
  const revenuePrevMonth = succeeded.filter(p => p.created_at >= startOfPrevMonth && p.created_at < startOfMonth).reduce((s, p) => s + Number(p.amount), 0)

  const totalOrders = allOrders.length
  const paidOrders = allOrders.filter(o => o.status === 'paid').length
  const pendingOrders = allOrders.filter(o => o.status === 'pending').length
  const paymentSuccessRate = totalOrders > 0 ? paidOrders / totalOrders : 0
  const avgOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0

  const change = revenuePrevMonth > 0 ? ((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100 : 0

  return {
    totalRevenue, totalOrders, paidOrders, pendingOrders,
    paymentSuccessRate, avgOrderValue, revenueThisMonth, revenuePrevMonth,
    trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
  }
}

// ── Payment Anomaly Detection ─────────────────────────────────────────────────

export async function detectPaymentAnomalies(orgId: string): Promise<AnomalyResult[]> {
  const admin = createAdminClient()
  const s7 = new Date(Date.now() - 7 * 86400000).toISOString()

  const { data } = await admin
    .from('payments')
    .select('status, amount, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', s7)

  const rows = data ?? []
  const anomalies: AnomalyResult[] = []

  if (rows.length > 0) {
    const failedCount = rows.filter(r => r.status === 'failed').length
    const failureRate = failedCount / rows.length

    if (failureRate >= 0.3) {
      anomalies.push({
        detected: true,
        type: 'high_failure_rate',
        severity: failureRate >= 0.5 ? 'critical' : 'warning',
        value: Math.round(failureRate * 100),
        threshold: 30,
        description: `${Math.round(failureRate * 100)}% of payments failed in the last 7 days`,
      })
    }
  }

  // Check for payment gaps (no payments in 7 days when historically active)
  const s30 = new Date(Date.now() - 30 * 86400000).toISOString()
  const { data: historicalData } = await admin
    .from('payments')
    .select('status')
    .eq('organization_id', orgId)
    .gte('created_at', s30)
    .lt('created_at', s7)
    .eq('status', 'succeeded')

  if ((historicalData ?? []).length >= 3 && rows.filter(r => r.status === 'succeeded').length === 0) {
    anomalies.push({
      detected: true,
      type: 'payment_gap',
      severity: 'warning',
      value: 0,
      threshold: 1,
      description: 'No successful payments in the last 7 days, but previously active',
    })
  }

  return anomalies
}

// ── Webhook Health ────────────────────────────────────────────────────────────

export async function detectWebhookAnomalies(): Promise<AnomalyResult[]> {
  const admin = createAdminClient()
  const s24h = new Date(Date.now() - 86400000).toISOString()

  const { data } = await admin
    .from('webhook_events')
    .select('status, created_at')
    .gte('created_at', s24h)

  const rows = data ?? []
  const anomalies: AnomalyResult[] = []

  if (rows.length > 0) {
    const failed = rows.filter(r => r.status === 'failed').length
    const failureRate = failed / rows.length

    if (failureRate >= 0.2) {
      anomalies.push({
        detected: true,
        type: 'webhook_failure_spike',
        severity: failureRate >= 0.5 ? 'critical' : 'warning',
        value: Math.round(failureRate * 100),
        threshold: 20,
        description: `${failed} webhook failures in the last 24 hours (${Math.round(failureRate * 100)}% failure rate)`,
      })
    }
  }

  return anomalies
}

// ── Activation Funnel ─────────────────────────────────────────────────────────

export async function analyzeActivationFunnel(orgId: string): Promise<ActivationFunnel> {
  const admin = createAdminClient()

  const [storefront, products, orders, payoutAccount] = await Promise.all([
    admin.from('storefronts').select('id, is_active').eq('organization_id', orgId).maybeSingle(),
    admin.from('products').select('id, status').eq('organization_id', orgId).limit(1),
    admin.from('orders').select('id, status').eq('organization_id', orgId).limit(5),
    admin.from('payout_accounts').select('id').eq('org_id', orgId).maybeSingle(),
  ])

  const hasStorefront = !!storefront.data
  const hasProducts = (products.data ?? []).length > 0
  const hasFirstOrder = (orders.data ?? []).length > 0
  const hasFirstPaidOrder = (orders.data ?? []).some(o => o.status === 'paid')
  const hasPayoutAccount = !!payoutAccount.data

  const steps = [hasStorefront, hasProducts, hasFirstOrder, hasFirstPaidOrder, hasPayoutAccount]
  const completionPct = Math.round((steps.filter(Boolean).length / steps.length) * 100)

  let nextStep = 'All steps complete — focus on growth'
  if (!hasStorefront) nextStep = 'Publish your storefront'
  else if (!hasProducts) nextStep = 'Add your first product'
  else if (!hasFirstOrder) nextStep = 'Share your store to get your first order'
  else if (!hasFirstPaidOrder) nextStep = 'Follow up on pending orders'
  else if (!hasPayoutAccount) nextStep = 'Add a bank account in Settings → Payments'

  return { hasStorefront, hasProducts, hasFirstOrder, hasFirstPaidOrder, hasPayoutAccount, completionPct, nextStep }
}

// ── Store Health Score ────────────────────────────────────────────────────────

export async function computeStoreHealthScore(orgId: string): Promise<StoreHealthScore> {
  const admin = createAdminClient()

  const [storefront, products, payments, payoutAccount] = await Promise.all([
    admin.from('storefronts').select('id, is_active').eq('organization_id', orgId).maybeSingle(),
    admin.from('products').select('id, status').eq('organization_id', orgId),
    admin.from('payments').select('status, created_at')
      .eq('organization_id', orgId)
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    admin.from('payout_accounts').select('id').eq('org_id', orgId).maybeSingle(),
  ])

  const hasStorefront = !!storefront.data?.is_active
  const allProducts = products.data ?? []
  const hasProducts = allProducts.length > 0
  const hasActiveProducts = allProducts.some(p => p.status === 'active')
  const allPayments = payments.data ?? []
  const succeededPayments = allPayments.filter(p => p.status === 'succeeded').length
  const paymentSuccessRate = allPayments.length > 0 ? succeededPayments / allPayments.length : 0
  const hasPayoutAccount = !!payoutAccount.data

  const components = [
    { label: 'Storefront Published', score: hasStorefront ? 20 : 0, maxScore: 20, note: hasStorefront ? 'Store is live' : 'Publish your storefront' },
    { label: 'Active Products',      score: hasActiveProducts ? 20 : hasProducts ? 10 : 0, maxScore: 20, note: hasActiveProducts ? `${allProducts.filter(p => p.status === 'active').length} active products` : 'Activate your products' },
    { label: 'Recent Sales',         score: Math.min(20, succeededPayments * 4), maxScore: 20, note: `${succeededPayments} paid orders this month` },
    { label: 'Payment Reliability',  score: Math.round(paymentSuccessRate * 20), maxScore: 20, note: `${Math.round(paymentSuccessRate * 100)}% payment success rate` },
    { label: 'Payout Ready',         score: hasPayoutAccount ? 20 : 0, maxScore: 20, note: hasPayoutAccount ? 'Bank account linked' : 'Add bank account in Settings' },
  ]

  const score = components.reduce((s, c) => s + c.score, 0)
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F'

  return { score, grade, components }
}

// ── Creator Success Score ─────────────────────────────────────────────────────

export async function computeCreatorSuccessScore(orgId: string): Promise<CreatorSuccessScore> {
  const pipeline = await getRevenuePipeline(orgId)

  const revenueScore = Math.min(40, (pipeline.revenueThisMonth / Math.max(50000, 1)) * 40)
  const ordersScore = Math.min(20, pipeline.paidOrders * 2)
  const growthRate = pipeline.revenuePrevMonth > 0
    ? (pipeline.revenueThisMonth - pipeline.revenuePrevMonth) / pipeline.revenuePrevMonth
    : 0
  const growthScore = Math.min(20, Math.max(0, growthRate * 100))
  const paymentScore = pipeline.paymentSuccessRate * 20

  const score = Math.round(revenueScore + ordersScore + growthScore + paymentScore)
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F'

  return {
    score: Math.min(100, score),
    grade,
    revenue: pipeline.revenueThisMonth,
    orders: pipeline.paidOrders,
    growth: Math.round(growthRate * 100),
    paymentSuccessRate: pipeline.paymentSuccessRate,
  }
}

// ── Opportunity Scoring ───────────────────────────────────────────────────────

export async function scoreOpportunity(orgId: string, type: string): Promise<number> {
  const pipeline = await getRevenuePipeline(orgId)

  switch (type) {
    case 'upsell':
      return Math.min(100, Math.round((pipeline.avgOrderValue < 5000 ? 80 : 40) + (pipeline.paidOrders * 5)))
    case 'retention':
      return Math.min(100, Math.round(pipeline.paymentSuccessRate * 60 + (pipeline.paidOrders > 5 ? 40 : 20)))
    case 'campaign':
      return Math.min(100, Math.round((pipeline.trend === 'declining' ? 90 : pipeline.trend === 'stable' ? 60 : 30)))
    default:
      return 50
  }
}

// ── Revenue Forecast (simple linear extrapolation) ───────────────────────────

export async function forecastRevenue(orgId: string, daysAhead = 30): Promise<{ low: number; mid: number; high: number; confidence: number }> {
  const admin = createAdminClient()
  const s30 = new Date(Date.now() - 30 * 86400000).toISOString()

  const { data } = await admin
    .from('payments')
    .select('amount, created_at')
    .eq('organization_id', orgId)
    .eq('status', 'succeeded')
    .gte('created_at', s30)

  const rows = data ?? []
  if (rows.length === 0) return { low: 0, mid: 0, high: 0, confidence: 0.1 }

  const dailyRevenue = rows.reduce((s, r) => s + Number(r.amount), 0) / 30
  const mid = Math.round(dailyRevenue * daysAhead)

  return {
    low: Math.round(mid * 0.7),
    mid,
    high: Math.round(mid * 1.4),
    confidence: Math.min(0.85, 0.4 + rows.length * 0.01),
  }
}

// ── Payout Analysis ───────────────────────────────────────────────────────────

export async function analyzePayoutStatus(orgId: string) {
  const admin = createAdminClient()

  const [payments, completedPayouts, pendingPayouts, account] = await Promise.all([
    admin.from('payments').select('amount').eq('organization_id', orgId).eq('status', 'succeeded'),
    admin.from('payouts').select('amount').eq('org_id', orgId).in('status', ['approved', 'paid']),
    admin.from('payouts').select('amount, requested_at').eq('org_id', orgId).eq('status', 'pending'),
    admin.from('payout_accounts').select('bank_name, account_name').eq('org_id', orgId).maybeSingle(),
  ])

  const totalRevenue = (payments.data ?? []).reduce((s, p) => s + Number(p.amount), 0)
  const totalPaidOut = (completedPayouts.data ?? []).reduce((s, p) => s + Number(p.amount), 0)
  const pendingAmount = (pendingPayouts.data ?? []).reduce((s, p) => s + Number(p.amount), 0)
  const available = totalRevenue - totalPaidOut - pendingAmount

  return {
    available,
    totalRevenue,
    totalPaidOut,
    pendingAmount,
    pendingCount: (pendingPayouts.data ?? []).length,
    hasPayoutAccount: !!account.data,
    bankName: account.data?.bank_name ?? null,
    accountName: account.data?.account_name ?? null,
  }
}

// ── Product Performance ───────────────────────────────────────────────────────

export async function analyzeProductPerformance(orgId: string) {
  const admin = createAdminClient()

  const { data: products } = await admin
    .from('products')
    .select('id, title, price, status, created_at')
    .eq('organization_id', orgId)

  const { data: orderItems } = await admin
    .from('order_items')
    .select('product_id, product_name, quantity, price_at_time, orders!inner(status, organization_id)')
    .eq('orders.organization_id', orgId)

  const productMap = new Map<string, { title: string; revenue: number; orders: number }>()

  for (const item of orderItems ?? []) {
    const pid = item.product_id ?? 'unknown'
    const row = productMap.get(pid) ?? { title: item.product_name ?? 'Unknown', revenue: 0, orders: 0 }
    const orderData = Array.isArray(item.orders) ? item.orders[0] : item.orders
    if (orderData?.status === 'paid') row.revenue += Number(item.price_at_time) * Number(item.quantity)
    row.orders += 1
    productMap.set(pid, row)
  }

  const ranked = Array.from(productMap.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    totalProducts: (products ?? []).length,
    activeProducts: (products ?? []).filter(p => p.status === 'active').length,
    topProduct: ranked[0] ?? null,
    underperforming: ranked.filter(p => p.orders === 0).slice(0, 3),
  }
}
