import type { Metadata } from "next"
import { TrackingClient } from "./tracking-client"

export const metadata: Metadata = {
  title: "Order Tracking — Lummy",
  description: "Track your order status in real time.",
}

export default function TrackPage({ params }: { params: { orderId: string } }) {
  return <TrackingClient orderId={params.orderId} />
}
