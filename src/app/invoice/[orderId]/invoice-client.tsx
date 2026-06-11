"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft, Printer, Share2, CheckCheck, MessageCircle,
  MapPin, Phone, Calendar, Hash, Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/globalization"
import { cn } from "@/lib/utils"

type InvoiceStatus = "pending" | "confirmed" | "shipped" | "delivered"

interface InvoiceData {
  invoiceNumber: string
  orderNumber: string
  date: string
  dueDate: string
  status: InvoiceStatus
  currency: string
  seller: { name: string; store: string; phone: string; handle: string; address: string }
  customer: { name: string; phone: string; address: string }
  items: { name: string; category: string; qty: number; unitPrice: number }[]
  deliveryFee: number
  notes: string
}

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  pending:   { label: "Awaiting Payment", className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  confirmed: { label: "Confirmed",        className: "bg-brand-purple/10 text-brand-purple border-brand-purple/30" },
  shipped:   { label: "Shipped",          className: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30" },
  delivered: { label: "Paid & Delivered", className: "bg-brand-green/10 text-brand-green border-brand-green/30" },
}

function getMockInvoice(orderId: string): InvoiceData {
  const statusMap: Record<string, InvoiceStatus> = {
    "LMY-00234": "delivered", "LMY-00235": "shipped",
    "LMY-00236": "confirmed", "LMY-00237": "pending",
  }
  return {
    invoiceNumber: `INV-${orderId}`,
    orderNumber: orderId,
    date: "May 1, 2026",
    dueDate: "May 8, 2026",
    status: statusMap[orderId] ?? "confirmed",
    currency: "NGN",
    seller: {
      name: "Creator",
      store: "Your Store",
      phone: "+234 803 456 7890",
      handle: "",
      address: "",
    },
    customer: {
      name: "Amaka Okonkwo",
      phone: "+234 803 111 2222",
      address: "45 Adeola Odeku St, Victoria Island, Lagos",
    },
    items: [
      { name: "Ankara Print Peplum Top", category: "Clothing", qty: 1, unitPrice: 18500 },
      { name: "Matching Headwrap", category: "Accessories", qty: 1, unitPrice: 3500 },
    ],
    deliveryFee: 2500,
    notes: "Thank you for shopping with Your Store! 💜 Please reach out on WhatsApp if you have any questions.",
  }
}

export function InvoiceClient({ orderId }: { orderId: string }) {
  const invoice = getMockInvoice(orderId.toUpperCase())
  const [copied, setCopied] = React.useState(false)

  const subtotal = invoice.items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const total = subtotal + invoice.deliveryFee
  const statusCfg = statusConfig[invoice.status]
  const fmt = (n: number) => formatMoney(n, invoice.currency)

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) { navigator.share({ title: invoice.invoiceNumber, url }).catch(() => {}); return }
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const whatsappUrl = `https://wa.me/${invoice.customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hi ${invoice.customer.name.split(" ")[0]}! Here's your invoice (${invoice.invoiceNumber}) from ${invoice.seller.store} — Total: ${fmt(total)}. View it here: ${typeof window !== "undefined" ? window.location.href : ""}`
  )}`

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      {/* Toolbar (hidden on print) */}
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between px-4 bg-background/90 backdrop-blur-sm border-b border-border print:hidden">
        <Link href="/dashboard/orders" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Orders
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border hover:bg-accent transition-colors">
            {copied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Share2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => window.print()}
            className="flex h-8 items-center gap-1.5 px-3 rounded-xl border border-border bg-background hover:bg-accent text-xs font-semibold transition-colors">
            <Printer className="h-3.5 w-3.5" /> Print / PDF
          </button>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="whatsapp" size="sm" className="h-8 text-xs gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 fill-white" /> Send to customer
            </Button>
          </a>
        </div>
      </div>

      {/* Invoice document */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto my-6 print:my-0 rounded-2xl print:rounded-none bg-card border border-border print:border-0 shadow-sm overflow-hidden">

        {/* Header band */}
        <div className="bg-gradient-to-br from-brand-purple to-brand-indigo px-8 py-7 print:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <Zap className="h-5 w-5 text-white fill-white/70" />
              </div>
              <span className="text-white font-display font-bold text-lg">Lummy</span>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">Invoice</p>
              <p className="text-white font-display font-extrabold text-2xl">{invoice.invoiceNumber}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Meta row */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Order: <strong className="text-foreground">{invoice.orderNumber}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Date: <strong className="text-foreground">{invoice.date}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Due: <strong className="text-foreground">{invoice.dueDate}</strong></span>
              </div>
            </div>
            <span className={cn("inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border", statusCfg.className)}>
              {statusCfg.label}
            </span>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: "From", name: invoice.seller.store, sub: invoice.seller.name, phone: invoice.seller.phone, address: invoice.seller.address },
              { label: "To",   name: invoice.customer.name, phone: invoice.customer.phone, address: invoice.customer.address },
            ].map((party) => (
              <div key={party.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{party.label}</p>
                <p className="font-semibold text-sm">{party.name}</p>
                {party.sub && <p className="text-xs text-muted-foreground">{party.sub}</p>}
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3 w-3 flex-shrink-0" />{party.phone}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />{party.address}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Line items */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_60px_90px_90px] gap-3 px-4 py-2.5 bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Item</span><span className="text-center">Qty</span>
              <span className="text-right">Unit price</span><span className="text-right">Total</span>
            </div>
            {invoice.items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_60px_90px_90px] gap-3 px-4 py-3 border-t border-border">
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.category}</p>
                </div>
                <p className="text-sm text-center self-center">{item.qty}</p>
                <p className="text-sm text-right self-center">{fmt(item.unitPrice)}</p>
                <p className="text-sm font-semibold text-right self-center">{fmt(item.qty * item.unitPrice)}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 ml-auto max-w-xs">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Delivery fee</span><span>{fmt(invoice.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold border-t border-border pt-2">
              <span>Total</span><span className="text-brand-purple">{fmt(total)}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="rounded-xl bg-muted/50 border border-border p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Notes</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-border pt-5 text-center">
            <p className="text-xs text-muted-foreground">
              Powered by <strong className="text-foreground">Lummy</strong> · lummy.co/{invoice.seller.handle}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Questions? WhatsApp {invoice.seller.phone}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
