import type { Metadata } from "next"
import { InvoiceClient } from "./invoice-client"

export const metadata: Metadata = {
  title: "Invoice — Lummy",
  description: "Order invoice and receipt.",
}

export default function InvoicePage({ params }: { params: { orderId: string } }) {
  return <InvoiceClient orderId={params.orderId} />
}
