import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getRuntimeAppUrl } from "@/lib/runtime-config"
import { markPaymentCompleted } from "@/repositories/order-repository"

const PAYSTACK_API = "https://api.paystack.co"

// Called by Paystack as callback_url after payment (GET) or manually via POST
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const appUrl = getRuntimeAppUrl(request.url)
  const reference = searchParams.get("reference")
  if (!reference) {
    return NextResponse.redirect(`${appUrl}/?payment=invalid`)
  }
  return verifyAndRedirect(reference, appUrl)
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { reference?: string }
  if (!body.reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 })
  }
  return verifyAndRedirect(body.reference, getRuntimeAppUrl(request.url))
}

async function verifyAndRedirect(reference: string, appUrl: string): Promise<NextResponse> {
  const supabase = createClient()

  // 1. Verify with Paystack
  const res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  })
  const data = await res.json() as {
    status: boolean
    data?: {
      status: "success" | "failed" | "abandoned"
      amount: number
      currency: string
      reference: string
      metadata?: { order_id?: string; transaction_id?: string }
    }
  }

  if (!data.status || !data.data) {
    return NextResponse.redirect(`${appUrl}/?payment=failed`)
  }

  const tx = data.data
  // Support both camelCase (checkout flow) and snake_case (initiate flow) metadata keys
  const meta = tx.metadata as Record<string, string | undefined> | undefined
  const orderId = meta?.order_id ?? meta?.orderId
  const paymentId = meta?.paymentId ?? meta?.payment_id
  const transactionId = meta?.transaction_id ?? meta?.transactionId

  if (tx.status !== "success") {
    // Update transaction status
    if (transactionId) {
      await supabase.from("transactions").update({ status: "failed" }).eq("id", transactionId)
    }
    // Redirect back to the storefront if we can identify it, otherwise home
    if (orderId) {
      const orderRow = await supabase
        .from("orders")
        .select("creator_id, creator_profiles(handle)")
        .eq("id", orderId)
        .maybeSingle()
      const handle = (orderRow.data?.creator_profiles as { handle?: string } | null)?.handle
      if (handle) {
        return NextResponse.redirect(`${appUrl}/${handle}?payment=failed`)
      }
    }
    return NextResponse.redirect(`${appUrl}/?payment=failed`)
  }

  // 2. Mark payment completed — handles both payments table (checkout flow) and
  //    legacy transactions table (initiate flow). paymentId is the payments row ID.
  if (orderId && paymentId) {
    await markPaymentCompleted({
      orderId,
      paymentId,
      providerReference: tx.reference,
      providerEventId: `verify-${tx.reference}`,
    }).catch((err: unknown) => console.error("[payments/verify] markPaymentCompleted failed", err))
  } else if (orderId && transactionId) {
    // Legacy initiate flow: update transactions table directly
    const fee = Math.round(tx.amount * 0.015)
    await supabase.from("transactions").update({
      status: "paid",
      net_amount: tx.amount - fee,
      fee,
      paid_at: new Date().toISOString(),
    }).eq("id", transactionId).eq("order_id", orderId)
    await supabase.from("orders").update({
      status: "confirmed",
      payment_status: "paid",
    }).eq("id", orderId).eq("payment_status", "pending")
  }

  // Redirect to track page if we have orderId, otherwise home
  if (orderId) {
    return NextResponse.redirect(`${appUrl}/track/${orderId}?status=success`)
  }
  return NextResponse.redirect(`${appUrl}/?payment=success&ref=${reference}`)
}
