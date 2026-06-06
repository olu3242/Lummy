import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getRevenuePipeline } from '@/agents/intelligence'

const objectiveSchema = z.object({
  objective_type: z.enum(['revenue', 'orders', 'customers', 'products', 'conversion']),
  title: z.string().min(1).max(200),
  target_value: z.number().positive(),
  unit: z.string().default('NGN'),
  deadline_at: z.string().datetime().optional(),
})

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

// GET /api/business/objectives — list objectives with current progress
export async function GET() {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [objectives, pipeline] = await Promise.all([
    supabase.from('business_objectives').select('*').eq('organization_id', orgId).eq('status', 'active').order('created_at', { ascending: false }),
    getRevenuePipeline(orgId),
  ])

  if (objectives.error) return NextResponse.json({ error: objectives.error.message }, { status: 500 })

  // Update current values for revenue/orders objectives
  const updates = (objectives.data ?? []).map(async obj => {
    let currentValue = obj.current_value
    if (obj.objective_type === 'revenue') currentValue = pipeline.totalRevenue
    else if (obj.objective_type === 'orders') currentValue = pipeline.paidOrders

    const achieved = currentValue >= obj.target_value
    if (achieved || currentValue !== obj.current_value) {
      await supabase.from('business_objectives')
        .update({ current_value: currentValue, status: achieved ? 'achieved' : 'active', updated_at: new Date().toISOString() })
        .eq('id', obj.id)
    }
    return { ...obj, current_value: currentValue, progress: Math.min(100, Math.round((currentValue / obj.target_value) * 100)) }
  })

  const enriched = await Promise.all(updates)
  return NextResponse.json({ data: enriched })
}

// POST /api/business/objectives — create a new objective
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = objectiveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('business_objectives')
    .insert({ organization_id: orgId, ...parsed.data })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
