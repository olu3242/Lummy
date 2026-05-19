import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhatsAppContact {
  profile: { name: string }
  wa_id: string
}

interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  text?: { body: string }
  type: "text" | "image" | "audio" | "video" | "document" | "sticker" | "order" | "unknown"
}

interface WhatsAppChange {
  value: {
    messaging_product: string
    metadata: { display_phone_number: string; phone_number_id: string }
    contacts?: WhatsAppContact[]
    messages?: WhatsAppMessage[]
    statuses?: Array<{ id: string; status: string; timestamp: string; recipient_id: string }>
  }
  field: string
}

interface WebhookPayload {
  object: string
  entry: Array<{
    id: string
    changes: WhatsAppChange[]
  }>
}

// ─── Correlation ID ───────────────────────────────────────────────────────────

function correlationId(): string {
  return `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ─── HMAC-SHA256 verification (Meta App Secret) ──────────────────────────────

async function verifyMetaSignature(rawBody: string, signature: string, appSecret: string): Promise<boolean> {
  try {
    const expected = signature.startsWith("sha256=") ? signature.slice(7) : signature
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(appSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    )
    const computed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody))
    const hex = Array.from(new Uint8Array(computed)).map(b => b.toString(16).padStart(2, "0")).join("")
    return hex === expected
  } catch {
    return false
  }
}

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-hub-signature-256",
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  const cid = correlationId()
  const method = req.method

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS })
  }

  // ── GET: Meta webhook verification ──────────────────────────────────────────
  if (method === "GET") {
    const url = new URL(req.url)
    const mode      = url.searchParams.get("hub.mode")
    const token     = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")

    // Accept either naming convention (META_VERIFY_TOKEN is canonical for edge functions;
    // WHATSAPP_WEBHOOK_VERIFY_TOKEN is used in the Next.js env schema)
    const verifyToken = Deno.env.get("META_VERIFY_TOKEN") ?? Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") ?? ""

    console.log(JSON.stringify({ cid, event: "verification_attempt", mode, tokenMatch: token === verifyToken }))

    if (mode === "subscribe" && token === verifyToken) {
      console.log(JSON.stringify({ cid, event: "verification_success" }))
      return new Response(challenge, { status: 200, headers: { ...CORS, "Content-Type": "text/plain" } })
    }

    console.log(JSON.stringify({ cid, event: "verification_failed", mode, token }))
    return new Response("Forbidden", { status: 403, headers: CORS })
  }

  // ── POST: Incoming WhatsApp events ──────────────────────────────────────────
  if (method === "POST") {
    let rawBody: string
    try {
      rawBody = await req.text()
    } catch {
      return new Response(JSON.stringify({ error: "Body read error" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } })
    }

    // Signature verification — production-safety check
    const appSecret   = Deno.env.get("META_APP_SECRET") ?? ""
    const signature   = req.headers.get("x-hub-signature-256") ?? ""
    if (appSecret && signature) {
      const valid = await verifyMetaSignature(rawBody, signature, appSecret)
      if (!valid) {
        console.log(JSON.stringify({ cid, event: "signature_invalid" }))
        return new Response("Unauthorized", { status: 401, headers: CORS })
      }
    }

    let payload: WebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } })
    }

    // Always 200 immediately — process async to avoid Meta retry storms
    const processEvent = async () => {
      try {
        if (payload.object !== "whatsapp_business_account") {
          console.log(JSON.stringify({ cid, event: "unexpected_object", object: payload.object }))
          return
        }

        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        )

        for (const entry of payload.entry ?? []) {
          for (const change of entry.changes ?? []) {
            if (change.field !== "messages") continue

            const { messages, contacts, metadata } = change.value

            // ── Incoming messages ────────────────────────────────────────────
            for (const message of messages ?? []) {
              const contact = contacts?.find(c => c.wa_id === message.from)
              const senderName = contact?.profile?.name ?? "Unknown"
              const phoneNumberId = metadata?.phone_number_id

              console.log(JSON.stringify({
                cid, event: "incoming_message",
                from: message.from,
                type: message.type,
                messageId: message.id,
                phoneNumberId,
                senderName,
              }))

              // Resolve creator by phone_number_id first, then fallback to suffix match
              let creatorProfile: { id: string } | null = null

              if (phoneNumberId) {
                const { data } = await supabase
                  .from("creator_profiles")
                  .select("id")
                  .eq("whatsapp_phone_number_id", phoneNumberId)
                  .maybeSingle()
                creatorProfile = data as { id: string } | null
              }

              if (!creatorProfile && message.from) {
                // Fallback: load all creators with WhatsApp numbers and match suffix
                const suffix = message.from.replace(/\D/g, "").slice(-8)
                const { data: profiles } = await supabase
                  .from("creator_profiles")
                  .select("id, whatsapp_number")
                  .not("whatsapp_number", "is", null)
                  .limit(200)
                const match = (profiles ?? []).find((p: { whatsapp_number: string }) =>
                  String(p.whatsapp_number ?? "").replace(/\D/g, "").endsWith(suffix)
                )
                creatorProfile = match ? { id: (match as { id: string }).id } : null
              }

              if (creatorProfile) {
                const profileId = (creatorProfile as { id: string }).id
                const messageBody = (message.text as { body?: string } | undefined)?.body ?? null
                await supabase.from("whatsapp_events").insert({
                  creator_id: profileId,
                  event_type: "conversation",
                  platform: "whatsapp",
                  metadata: {
                    wa_message_id: message.id,
                    from: message.from,
                    sender_name: senderName,
                    message_type: message.type,
                    message_body: messageBody ? messageBody.slice(0, 500) : null,
                    phone_number_id: phoneNumberId,
                    wa_timestamp: message.timestamp,
                  },
                })

                // Update daily metrics
                const today = new Date().toISOString().split("T")[0]
                const { data: existing } = await supabase
                  .from("creator_metrics_daily")
                  .select("whatsapp_clicks")
                  .eq("creator_id", profileId)
                  .eq("date", today)
                  .maybeSingle()

                const current = (existing as { whatsapp_clicks: number } | null)?.whatsapp_clicks ?? 0
                await supabase
                  .from("creator_metrics_daily")
                  .upsert({ creator_id: profileId, date: today, whatsapp_clicks: current + 1 }, { onConflict: "creator_id,date" })
              }

              // ── Future: route to automation engine ──────────────────────────
              // await queueAutomationEvent({ type: "whatsapp_message", payload: message, cid })
            }

            // ── Status updates (sent, delivered, read) ─────────────────────
            for (const status of change.value.statuses ?? []) {
              console.log(JSON.stringify({ cid, event: "message_status", status: status.status, messageId: status.id }))
            }
          }
        }
      } catch (err) {
        console.error(JSON.stringify({ cid, event: "process_error", error: String(err) }))
      }
    }

    // Fire and forget — do NOT await
    processEvent()

    return new Response(JSON.stringify({ received: true, cid }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  }

  return new Response("Method Not Allowed", { status: 405, headers: CORS })
})
