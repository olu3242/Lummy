/**
 * /api/webhooks/whatsapp
 *
 * Primary Meta webhook endpoint for Lummy's Next.js app.
 * Register this URL in Meta App Dashboard → WhatsApp → Configuration:
 *   https://lummy.co/api/webhooks/whatsapp
 *
 * Required env vars:
 *   WHATSAPP_WEBHOOK_VERIFY_TOKEN  — arbitrary secret token set in Meta dashboard
 *   META_APP_SECRET                — Meta App Secret (for HMAC signature verification)
 *
 * GET  → Meta hub challenge verification
 * POST → Incoming messages, statuses, and delivery events
 */
import crypto from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// ─── Types ────────────────────────────────────────────────────────────────────

interface WAContact {
  profile: { name: string }
  wa_id: string
}

interface WAMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: { body: string }
}

interface WAChange {
  field: string
  value: {
    messaging_product: string
    metadata: { display_phone_number: string; phone_number_id: string }
    contacts?: WAContact[]
    messages?: WAMessage[]
    statuses?: Array<{ id: string; status: string; timestamp: string; recipient_id: string }>
  }
}

interface WAPayload {
  object: string
  entry: Array<{ id: string; changes: WAChange[] }>
}

// ─── HMAC verification ────────────────────────────────────────────────────────

function verifySignature(rawBody: string, signature: string, appSecret: string): boolean {
  if (!appSecret || !signature) return false
  const expected = signature.startsWith("sha256=") ? signature.slice(7) : signature
  const computed = crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex")
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(expected, "hex"))
  } catch {
    return false
  }
}

// ─── GET: Meta webhook verification ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get("hub.mode")
  const token     = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? ""

  if (!verifyToken) {
    // Fail closed — if the env var is unset, never verify
    console.error("[whatsapp/webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN not configured")
    return new NextResponse("Forbidden", { status: 403 })
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    console.log("[whatsapp/webhook] verification success")
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })
  }

  console.warn("[whatsapp/webhook] verification failed", { mode, tokenMatch: token === verifyToken })
  return new NextResponse("Forbidden", { status: 403 })
}

// ─── POST: Incoming events ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: "Body read error" }, { status: 400 })
  }

  // Signature check — only enforced when META_APP_SECRET is configured
  const appSecret = process.env.META_APP_SECRET ?? ""
  const signature = request.headers.get("x-hub-signature-256") ?? ""
  if (appSecret) {
    if (!verifySignature(rawBody, signature, appSecret)) {
      console.warn("[whatsapp/webhook] invalid signature")
      return new NextResponse("Unauthorized", { status: 401 })
    }
  }

  // Always acknowledge immediately — Meta will retry if we don't 200 fast enough
  const processAsync = async () => {
    let payload: WAPayload
    try {
      payload = JSON.parse(rawBody) as WAPayload
    } catch {
      console.error("[whatsapp/webhook] invalid JSON payload")
      return
    }

    if (payload.object !== "whatsapp_business_account") {
      console.log("[whatsapp/webhook] unexpected object type", payload.object)
      return
    }

    const supabase = createAdminClient()
    const today = new Date().toISOString().split("T")[0]

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue

        const { messages, contacts, statuses, metadata: waMetadata } = change.value

        // ── Incoming messages ──────────────────────────────────────────────
        for (const message of messages ?? []) {
          const contact = contacts?.find(c => c.wa_id === message.from)
          const senderName = contact?.profile?.name ?? null

          // Resolve creator by phone_number_id stored in creator_profiles
          // Falls back to partial matching if phone_number_id column exists
          const phoneNumberId = waMetadata?.phone_number_id ?? null
          let creatorId: string | null = null

          if (phoneNumberId) {
            const { data: byPhoneId } = await supabase
              .from("creator_profiles")
              .select("id")
              .eq("whatsapp_phone_number_id", phoneNumberId)
              .maybeSingle()
            creatorId = (byPhoneId as { id: string } | null)?.id ?? null
          }

          // Fallback: match by phone number suffix (last 8 digits)
          if (!creatorId && message.from) {
            const suffix = message.from.replace(/\D/g, "").slice(-8)
            const { data: byPhone } = await supabase
              .from("creator_profiles")
              .select("id, whatsapp_number")
              .not("whatsapp_number", "is", null)
              .limit(100)
            const match = (byPhone ?? []).find((p: Record<string, unknown>) =>
              String(p.whatsapp_number ?? "").replace(/\D/g, "").endsWith(suffix)
            )
            creatorId = (match as { id: string } | null)?.id ?? null
          }

          if (!creatorId) {
            console.warn("[whatsapp/webhook] could not resolve creator for phone", { from: message.from, phoneNumberId })
            continue
          }

          const messageBody = message.text?.body ?? null

          // Persist event with full metadata
          await supabase.from("whatsapp_events").insert({
            creator_id: creatorId,
            event_type: "conversation",
            platform: "whatsapp",
            metadata: {
              wa_message_id: message.id,
              from: message.from,
              sender_name: senderName,
              message_type: message.type,
              message_body: messageBody ? messageBody.slice(0, 500) : null,  // cap at 500 chars
              phone_number_id: phoneNumberId,
              wa_timestamp: message.timestamp,
            },
          })

          // Upsert daily metric
          const { data: existing } = await supabase
            .from("creator_metrics_daily")
            .select("whatsapp_clicks")
            .eq("creator_id", creatorId)
            .eq("date", today)
            .maybeSingle()

          const current = (existing as { whatsapp_clicks: number } | null)?.whatsapp_clicks ?? 0
          await supabase
            .from("creator_metrics_daily")
            .upsert(
              { creator_id: creatorId, date: today, whatsapp_clicks: current + 1 },
              { onConflict: "creator_id,date" }
            )

          console.log("[whatsapp/webhook] message persisted", {
            creatorId, from: message.from, type: message.type,
          })
        }

        // ── Status updates (sent, delivered, read) ─────────────────────────
        for (const status of statuses ?? []) {
          console.log("[whatsapp/webhook] status update", { status: status.status, messageId: status.id })
        }
      }
    }
  }

  // Fire and forget — do NOT await
  void processAsync().catch(err => console.error("[whatsapp/webhook] process error", err))

  return NextResponse.json({ received: true }, { status: 200 })
}
