import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { askCopilot, generateBriefing } from '@/agents/copilot'

const askSchema = z.object({
  question: z.string().min(1).max(500),
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

// POST /api/copilot — ask Lummy a question
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = askSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Question required' }, { status: 400 })
  }

  try {
    const response = await askCopilot(parsed.data.question, orgId)
    return NextResponse.json({ data: response })
  } catch (err) {
    return NextResponse.json({ error: 'Copilot unavailable', detail: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

// GET /api/copilot?briefing=daily|weekly|monthly — get executive briefing
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const type = (new URL(request.url).searchParams.get('briefing') ?? 'daily') as 'daily' | 'weekly' | 'monthly'

  try {
    const briefing = await generateBriefing(orgId, type)
    return NextResponse.json({ data: briefing })
  } catch (err) {
    return NextResponse.json({ error: 'Briefing generation failed', detail: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
