import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getPlatformCommsSummary } from "@/lib/whatsapp/effectiveness"
import { runWhatsAppContinuityAudit } from "@/lib/whatsapp/continuity"

export const dynamic = "force-dynamic"

async function isAdmin(supabase: ReturnType<typeof createAdminClient>, userId: string, email?: string): Promise<boolean> {
  const { data } = await supabase.from("creator_profiles").select("is_admin").eq("user_id", userId).maybeSingle()
  return (data as { is_admin?: boolean } | null)?.is_admin === true || email?.endsWith("@lummy.co") === true
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isAdmin(admin, user.id, user.email ?? undefined))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [comms, continuity] = await Promise.allSettled([
    getPlatformCommsSummary(),
    runWhatsAppContinuityAudit(),
  ])

  return NextResponse.json({
    comms: comms.status === "fulfilled" ? comms.value : null,
    continuity: continuity.status === "fulfilled" ? continuity.value : null,
    generatedAt: new Date().toISOString(),
  })
}
