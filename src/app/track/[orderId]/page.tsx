import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { TrackingClient, type TrackingOrder } from "./tracking-client"

export const metadata: Metadata = {
  title: "Order Tracking — Lummy",
  description: "Track your order status in real time.",
}

async function fetchOrder(orderId: string): Promise<TrackingOrder | null> {
  try {
    const supabase = supabaseAdmin()
    const { data: order } = await supabase
      .from("orders")
      .select(`
        id, status, payment_status, amount, currency, customer_email,
        customer_name, customer_phone, customer_address, notes, created_at,
        creator_profiles!orders_creator_id_fkey(display_name, whatsapp_number, handle)
      `)
      .eq("id", orderId)
      .maybeSingle()

    if (!order) return null

    const creator = order.creator_profiles as { display_name?: string; whatsapp_number?: string; handle?: string } | null
    const statusMap: Record<string, "confirmed" | "processing" | "shipped" | "delivered"> = {
      confirmed: "confirmed",
      processing: "processing",
      shipped: "shipped",
      delivered: "delivered",
    }
    const trackStatus = statusMap[order.status] ?? "confirmed"

    return {
      id: order.id,
      status: trackStatus,
      product: {
        name: order.notes ?? "Your order",
        image: "",
        price: Number(order.amount) / 100,
        qty: 1,
      },
      seller: {
        name: creator?.display_name ?? "Store",
        phone: creator?.whatsapp_number ?? "",
        handle: creator?.handle ?? "",
      },
      customer: {
        name: order.customer_name ?? order.customer_email ?? "Customer",
        address: order.customer_address ?? "",
      },
      estimatedDelivery: trackStatus === "delivered" ? "Delivered" : "Estimated 2–5 business days",
      courier: "",
      trackingRef: order.id.slice(0, 8).toUpperCase(),
      timeline: [
        { status: "confirmed",  label: "Order Confirmed",  desc: "Payment confirmed and order received.", time: new Date(order.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }), done: true },
        { status: "processing", label: "Being Prepared",   desc: "Seller is preparing your item.",         time: "", done: ["processing","shipped","delivered"].includes(trackStatus) },
        { status: "shipped",    label: "Out for Delivery",  desc: "Your order is on its way.",               time: "", done: ["shipped","delivered"].includes(trackStatus) },
        { status: "delivered",  label: "Delivered",         desc: "Your order has been delivered. Enjoy! 🎉", time: "", done: trackStatus === "delivered" },
      ],
    }
  } catch {
    return null
  }
}

export default async function TrackPage({ params }: { params: { orderId: string } }) {
  const order = await fetchOrder(params.orderId)
  return <TrackingClient orderId={params.orderId} initialOrder={order} />
}
