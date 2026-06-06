import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

// GET /api/agent-actions — list proposed actions for org
export async function GET() {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('agent_actions')
    .select('*, agent_action_approvals(status, approved_at)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
