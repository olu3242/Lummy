import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { initiatePaymentSchema } from "@/lib/validations/payment"
import type { ProductRow, OrderRow, TransactionRow } from "@/lib/supabase/types"

const PAYSTACK_API = "https://api.paystack.co"

type ProductQueryResult = Pick<
  ProductRow,
  "id" | "name" | "price" | "currency" | "is_published" | "stock_quantity" | "is_unlimited_stock" | "creator_id"
>

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = initiatePaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 })
    }

    const { productId, creatorId, email, quantity } = parsed.data
    const supabase = createClient()

    // 1. Fetch product server-side — never trust client price
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("id, name, price, currency, is_published, stock_quantity, is_unlimited_stock, creator_id")
      .eq("id", productId)
      .eq("is_published", true)
      .maybeSingle()

    const product = productData as ProductQueryResult | null
    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    if (product.creator_id !== creatorId) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    if (!product.is_unlimited_stock && product.stock_quantity !== null && product.stock_quantity < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 409 })
    }

    // 2. Create pending order
    const totalAmount = product.price * quantity

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        creator_id: creatorId,
        status: "pending" as const,
        payment_status: "pending" as const,
        total_amount: totalAmount,
        currency: product.currency ?? "NGN",
      })
      .select("id, order_number")
      .single()

    const order = orderData as Pick<OrderRow, "id" | "order_number"> | null
    if (orderError || !order) {
      console.error("[payments/initiate] order creation failed:", orderError?.message)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // 3. Create pending transaction
    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .insert({
        order_id: order.id,
        creator_id: creatorId,
        provider: "paystack" as const,
        amount: totalAmount,
        currency: product.currency ?? "NGN",
        status: "pending" as const,
      })
      .select("id")
      .single()

    const transaction = txData as Pick<TransactionRow, "id"> | null
    if (txError || !transaction) {
      console.error("[payments/initiate] transaction creation failed:", txError?.message)
      return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 })
    }

    // 4. Initialize Paystack transaction
    const paystackResponse = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: totalAmount,
        currency: product.currency ?? "NGN",
        reference: `LMY-${order.order_number}-${Date.now()}`,
        metadata: {
          order_id: order.id,
          transaction_id: transaction.id,
          product_id: productId,
          product_name: product.name,
          quantity,
          custom_fields: [
            { display_name: "Order Number", variable_name: "order_number", value: order.order_number },
            { display_name: "Product",       variable_name: "product_name", value: product.name },
          ],
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify`,
      }),
    })

    const paystackData = await paystackResponse.json() as {
      status: boolean
      message: string
      data?: { authorization_url: string; access_code: string; reference: string }
    }

    if (!paystackData.status || !paystackData.data) {
      console.error("[payments/initiate] Paystack error:", paystackData.message)
      return NextResponse.json({ error: "Payment provider error" }, { status: 502 })
    }

    // 5. Store Paystack reference
    await supabase
      .from("transactions")
      .update({ provider_reference: paystackData.data.reference })
      .eq("id", transaction.id)

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
      order_number: order.order_number,
    })
  } catch (err) {
    console.error("[payments/initiate] unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
