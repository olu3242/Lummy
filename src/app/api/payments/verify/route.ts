import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PAYSTACK_API = "https://api.paystack.co"

// Called by Paystack as callback_url after payment (GET) or manually via POST
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get("reference")
  if (!reference) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?payment=invalid`)
  }
  return verifyAndRedirect(reference)
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { reference?: string }
  if (!body.reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 })
  }
  return verifyAndRedirect(body.reference)
}

async function verifyAndRedirect(reference: string): Promise<NextResponse> {
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
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?payment=failed`)
  }

  const tx = data.data
  const orderId = tx.metadata?.order_id
  const transactionId = tx.metadata?.transaction_id

  if (tx.status !== "success") {
    // Update transaction status
    if (transactionId) {
      await supabase.from("transactions").update({ status: "failed" }).eq("id", transactionId)
    }
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?payment=failed`)
  }

  // 2. Update transaction record
  if (transactionId) {
    const fee = Math.round(tx.amount * 0.015) // Paystack 1.5% fee estimate
    await supabase.from("transactions").update({
      status: "paid",
      net_amount: tx.amount - fee,
      fee,
      paid_at: new Date().toISOString(),
    }).eq("id", transactionId)
  }

  // 3. Update order to confirmed
  if (orderId) {
    await supabase.from("orders").update({
      status: "confirmed",
      payment_status: "paid",
    }).eq("id", orderId)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return NextResponse.redirect(`${appUrl}/?payment=success&ref=${reference}`)
}
