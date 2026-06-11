import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { validateInviteCode } from "@/lib/creator/traction"
import { isEnabled } from "@/lib/flags/feature-flags"

const Schema = z.object({ code: z.string().min(1).max(20) })

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 400 })
  }

  const gateEnabled = await isEnabled("beta_invite_gate")
  if (!gateEnabled) {
    return NextResponse.json({ valid: true, gateDisabled: true })
  }

  const result = await validateInviteCode(parsed.data.code)
  return NextResponse.json(result)
}
