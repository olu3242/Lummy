import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const approveSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().max(500).optional(),
})

type Params = { params: { id: string } }

async function getAuthContext(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return { userId: user.id, orgId: data?.organization_id ?? null }
}

// POST /api/agent-actions/:id/approve — approve or reject an action
export async function POST(request: NextRequest, { params }: Params) {
  const supabase = createClient()
  const ctx = await getAuthContext(supabase)
  if (!ctx?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = approveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid decision', details: parsed.error.flatten() }, { status: 400 })
  }

  // Verify action belongs to this org
  const { data: action } = await supabase
    .from('agent_actions')
    .select('id, status, organization_id')
    .eq('id', params.id)
    .eq('organization_id', ctx.orgId)
    .maybeSingle()

  if (!action) return NextResponse.json({ error: 'Action not found' }, { status: 404 })
  if (action.status !== 'proposed') {
    return NextResponse.json({ error: `Action already ${action.status}` }, { status: 409 })
  }

  const newStatus = parsed.data.decision === 'approved' ? 'approved' : 'rejected'

  const [updatedAction, approval] = await Promise.all([
    supabase.from('agent_actions')
      .update({ status: newStatus })
      .eq('id', params.id)
      .select('*')
      .single(),
    supabase.from('agent_action_approvals')
      .insert({
        action_id: params.id,
        approved_by: ctx.userId,
        approved_at: new Date().toISOString(),
        status: parsed.data.decision,
        notes: parsed.data.notes ?? null,
      })
      .select('*')
      .single(),
  ])

  if (updatedAction.error) return NextResponse.json({ error: updatedAction.error.message }, { status: 500 })

  return NextResponse.json({ data: { action: updatedAction.data, approval: approval.data } })
}
