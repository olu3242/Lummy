import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { whatsappProvisioningSchema } from "@/lib/validations/whatsapp"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("creator_profiles")
    .select("whatsapp_phone_number_id, whatsapp_business_account_id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    whatsappPhoneNumberId: data?.whatsapp_phone_number_id ?? null,
    whatsappBusinessAccountId: data?.whatsapp_business_account_id ?? null,
    configured: Boolean(data?.whatsapp_phone_number_id && data?.whatsapp_business_account_id),
  })
}

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = whatsappProvisioningSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
  }

  // Each Meta phone_number_id must map to exactly one creator (enforced by the
  // unique index from migration 059) — surface a clear error instead of a raw
  // constraint violation if another creator already claimed it.
  const { data: existing } = await supabase
    .from("creator_profiles")
    .select("user_id")
    .eq("whatsapp_phone_number_id", parsed.data.whatsappPhoneNumberId)
    .maybeSingle()
  if (existing && existing.user_id !== user.id) {
    return NextResponse.json({ error: "This WhatsApp phone number is already linked to another Lummy store" }, { status: 409 })
  }

  const { data, error } = await supabase
    .from("creator_profiles")
    .update({
      whatsapp_phone_number_id: parsed.data.whatsappPhoneNumberId,
      whatsapp_business_account_id: parsed.data.whatsappBusinessAccountId,
    })
    .eq("user_id", user.id)
    .select("whatsapp_phone_number_id, whatsapp_business_account_id")
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: "Creator profile not found" }, { status: 404 })

  return NextResponse.json({
    whatsappPhoneNumberId: data.whatsapp_phone_number_id,
    whatsappBusinessAccountId: data.whatsapp_business_account_id,
    configured: true,
  })
}
