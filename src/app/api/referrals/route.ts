import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getReferralStats, applyReferralCode } from "@/lib/referrals"

async function resolveCreatorId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from("creator_profiles").select("id").eq("user_id", userId).maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

const ApplySchema = z.object({ code: z.string().min(1).max(20) })

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const creatorId = await resolveCreatorId(user.id)
  if (!creatorId) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const stats = await getReferralStats(creatorId)
  return NextResponse.json(stats)
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = ApplySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const creatorId = await resolveCreatorId(user.id)
  if (!creatorId) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const ok = await applyReferralCode(parsed.data.code, creatorId)
  if (!ok) return NextResponse.json({ error: "Invalid or already used referral code" }, { status: 400 })

  return NextResponse.json({ ok: true })
}
