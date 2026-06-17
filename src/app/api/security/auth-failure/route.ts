import { NextResponse } from "next/server"
import { z } from "zod"
import { recordSecurityEvent } from "@/lib/security/events"

export const dynamic = "force-dynamic"

// security_events writes require the service-role client, which the login/
// signup pages (client components, anon key only) can't reach directly —
// this endpoint is the narrow, validated path for them to report an auth
// failure without ever touching the service-role key.
const schema = z.object({
  eventType: z.enum(["failed_login", "failed_signup"]),
  email: z.string().email().optional(),
  reason: z.string().max(200).optional(),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  await recordSecurityEvent({
    eventType: parsed.data.eventType,
    severity: "low",
    endpoint: parsed.data.eventType === "failed_login" ? "/login" : "/signup",
    details: {
      // Never store the raw email — only enough to spot brute-force patterns.
      emailDomain: parsed.data.email?.split("@")[1] ?? null,
      reason: parsed.data.reason ?? null,
    },
  })

  return NextResponse.json({ ok: true })
}
