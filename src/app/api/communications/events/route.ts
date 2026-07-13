import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { recordCommunicationEvent } from "@/lib/communications/communication-service"

const allowedEvents = new Set(["sent", "opened", "clicked", "bounced", "complained"])

export async function POST(request: NextRequest) {
  const secret = process.env.COMMUNICATION_WEBHOOK_SECRET
  if (secret && request.headers.get("x-communication-webhook-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json() as {
    provider_message_id?: string
    event_type?: string
    metadata?: Record<string, unknown>
  }

  if (!body.provider_message_id || !body.event_type || !allowedEvents.has(body.event_type)) {
    return NextResponse.json({ error: "Invalid communication event" }, { status: 400 })
  }

  const admin = createAdminClient()
  const delivery = await admin
    .from("communication_deliveries")
    .select("id,organization_id,template_id,recipient")
    .eq("provider_message_id", body.provider_message_id)
    .maybeSingle()

  if (delivery.error) throw delivery.error
  if (!delivery.data) return NextResponse.json({ error: "Delivery not found" }, { status: 404 })

  const row = delivery.data as {
    id: string
    organization_id: string | null
    template_id: string
    recipient: string
  }

  const event = await recordCommunicationEvent({
    deliveryId: row.id,
    organizationId: row.organization_id,
    templateId: row.template_id,
    recipient: row.recipient,
    eventType: body.event_type as "sent" | "opened" | "clicked" | "bounced" | "complained",
    metadata: body.metadata ?? {},
  })

  if (body.event_type === "bounced" || body.event_type === "complained") {
    await admin
      .from("communication_deliveries")
      .update({ provider_status: body.event_type, error: body.metadata ?? {} })
      .eq("id", row.id)
      .throwOnError()
  }

  if (body.event_type === "sent" || body.event_type === "opened" || body.event_type === "clicked") {
    await admin
      .from("communication_deliveries")
      .update({ provider_status: body.event_type === "sent" ? "delivered" : "delivered", delivered_at: new Date().toISOString() })
      .eq("id", row.id)
      .throwOnError()
  }

  return NextResponse.json({ ok: true, event })
}
