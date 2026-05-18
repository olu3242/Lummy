import { NextResponse, type NextRequest } from "next/server"
import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/server"
import { recordWebhookReceived, markWebhookProcessed, markWebhookFailed } from "@/lib/webhooks/retry"
import { trackEvent, trackError } from "@/lib/observability/events"
import { generateCorrelationId } from "@/lib/observability/correlation"

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return false
  const hash = crypto.createHmac("sha512", secret).update(payload).digest("hex")
  return hash === signature
}

export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId("ps")
  const rawBody = await request.text()
  const signature = request.headers.get("x-paystack-signature") ?? ""

  if (!verifySignature(rawBody, signature)) {
    trackError("webhook.failed", "Invalid signature", { source: "paystack", correlationId })
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: { event: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  trackEvent("webhook.received", { source: "paystack", eventType: event.event, correlationId })

  const webhookId = await recordWebhookReceived("paystack", event.event, event.data, correlationId)

  const supabase = createAdminClient()

  try {
    if (event.event === "charge.success") {
      const charge = event.data as {
        reference: string
        amount: number
        status: string
        metadata?: { order_id?: string; transaction_id?: string }
      }

      const orderId = charge.metadata?.order_id
      const transactionId = charge.metadata?.transaction_id

      if (transactionId) {
        const fee = Math.round(charge.amount * 0.015)
        await supabase.from("transactions").update({
          status: "paid",
          net_amount: charge.amount - fee,
          fee,
          paid_at: new Date().toISOString(),
        }).eq("id", transactionId)
      }

      if (orderId) {
        await supabase.from("orders").update({
          status: "confirmed",
          payment_status: "paid",
        }).eq("id", orderId)
      }

      trackEvent("order.paid", { correlationId, orderId, transactionId })
    }

    if (event.event === "charge.failed") {
      const charge = event.data as { metadata?: { transaction_id?: string } }
      const transactionId = charge.metadata?.transaction_id
      if (transactionId) {
        await supabase.from("transactions").update({ status: "failed" }).eq("id", transactionId)
      }
      trackEvent("order.failed", { correlationId, transactionId })
    }

    if (webhookId) await markWebhookProcessed(webhookId)
  } catch (err) {
    trackError("webhook.failed", err, { source: "paystack", eventType: event.event, correlationId })
    if (webhookId) await markWebhookFailed(webhookId, err instanceof Error ? err.message : String(err))
  }

  // Always return 200 to acknowledge receipt — Paystack retries on non-200
  return NextResponse.json({ received: true })
}
