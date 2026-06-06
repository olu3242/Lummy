import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRevenuePipeline, forecastRevenue, computeStoreHealthScore, computeCreatorSuccessScore } from '@/agents/intelligence'

async function getOrgId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return data?.organization_id ?? null
}

// GET /api/business/kpis — compute and return all business KPIs
export async function GET() {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [pipeline, forecast, health, success] = await Promise.all([
    getRevenuePipeline(orgId),
    forecastRevenue(orgId, 30),
    computeStoreHealthScore(orgId),
    computeCreatorSuccessScore(orgId),
  ])

  // Cache KPIs in DB (upsert)
  const kpiRows = [
    { metric_name: 'total_revenue',          metric_value: pipeline.totalRevenue,              metric_unit: 'NGN',     period: 'all' },
    { metric_name: 'revenue_this_month',      metric_value: pipeline.revenueThisMonth,          metric_unit: 'NGN',     period: '30d' },
    { metric_name: 'total_orders',            metric_value: pipeline.totalOrders,               metric_unit: 'count',   period: 'all' },
    { metric_name: 'paid_orders',             metric_value: pipeline.paidOrders,                metric_unit: 'count',   period: 'all' },
    { metric_name: 'payment_success_rate',    metric_value: pipeline.paymentSuccessRate * 100,  metric_unit: 'percent', period: '30d' },
    { metric_name: 'avg_order_value',         metric_value: pipeline.avgOrderValue,             metric_unit: 'NGN',     period: 'all' },
    { metric_name: 'store_health_score',      metric_value: health.score,                       metric_unit: 'score',   period: 'current' },
    { metric_name: 'creator_success_score',   metric_value: success.score,                      metric_unit: 'score',   period: 'current' },
    { metric_name: 'revenue_forecast_30d',    metric_value: forecast.mid,                       metric_unit: 'NGN',     period: '30d' },
  ]

  await supabase.from('business_kpis').upsert(
    kpiRows.map(k => ({ organization_id: orgId, ...k, computed_at: new Date().toISOString() })),
    { onConflict: 'organization_id,metric_name,period' }
  )

  return NextResponse.json({
    data: {
      pipeline,
      health: { score: health.score, grade: health.grade, components: health.components },
      success: { score: success.score, grade: success.grade },
      forecast,
      kpis: kpiRows,
    }
  })
}
