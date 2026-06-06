import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AGENTS, type AgentName } from '@/agents/registry'
import { executeAgent } from '@/agents/runtime'

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

// GET /api/agents — list all agents with recent status
export async function GET() {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch recent recommendations per agent
  const { data: recs } = await supabase
    .from('agent_recommendations')
    .select('agent_name, status, created_at')
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .gte('created_at', new Date(Date.now() - 24 * 3600000).toISOString())

  const recsByAgent = new Map<string, number>()
  for (const r of recs ?? []) {
    recsByAgent.set(r.agent_name, (recsByAgent.get(r.agent_name) ?? 0) + 1)
  }

  const agents = Object.values(AGENTS).map(a => ({
    name: a.name,
    displayName: a.displayName,
    type: a.type,
    description: a.description,
    emoji: a.emoji,
    color: a.color,
    activeRecommendations: recsByAgent.get(a.name) ?? 0,
  }))

  return NextResponse.json({ data: agents })
}

// POST /api/agents?run=NOVA — trigger a specific agent
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agentName = (new URL(request.url).searchParams.get('run') ?? 'NOVA').toUpperCase() as AgentName

  if (!AGENTS[agentName]) {
    return NextResponse.json({ error: `Unknown agent: ${agentName}` }, { status: 400 })
  }

  try {
    const result = await executeAgent(agentName, orgId, { type: 'on_demand', source: 'api' })
    return NextResponse.json({ data: result })
  } catch (err) {
    return NextResponse.json({ error: 'Agent execution failed', detail: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
