import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getCreatorActions, completeAction } from "@/lib/creator/actions"

async function resolveCreatorId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from("creator_profiles").select("id").eq("user_id", userId).maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

const CompleteSchema = z.object({ actionKey: z.string().min(1).max(60) })

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const creatorId = await resolveCreatorId(user.id)
  if (!creatorId) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const { actions, completedKeys, urgentCount } = await getCreatorActions(creatorId)

  return NextResponse.json({
    actions,
    completedCount: completedKeys.size,
    urgentCount,
  })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = CompleteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const creatorId = await resolveCreatorId(user.id)
  if (!creatorId) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  await completeAction(creatorId, parsed.data.actionKey)
  return NextResponse.json({ ok: true })
}
