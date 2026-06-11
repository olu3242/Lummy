import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { getAllFlags, setFlag } from "@/lib/flags/feature-flags"
import { createClient, createAdminClient } from "@/lib/supabase/server"

async function requireAdmin(userId: string, email?: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("creator_profiles")
    .select("is_admin")
    .eq("user_id", userId)
    .maybeSingle()
  return (data as { is_admin?: boolean } | null)?.is_admin === true
    || (email?.endsWith("@lummy.co") ?? false)
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!await requireAdmin(user.id, user.email ?? undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const flags = await getAllFlags()
  return NextResponse.json({ data: flags })
}

const UpdateSchema = z.object({
  key: z.string().min(1),
  enabled: z.boolean(),
  rolloutPct: z.number().int().min(0).max(100).optional(),
})

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!await requireAdmin(user.id, user.email ?? undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  await setFlag(parsed.data.key, parsed.data.enabled, parsed.data.rolloutPct)
  return NextResponse.json({ ok: true })
}
