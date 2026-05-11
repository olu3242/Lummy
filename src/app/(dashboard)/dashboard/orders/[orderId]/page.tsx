"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft, Package, CheckCircle2, Clock, Truck, Home,
  XCircle, MessageCircle, MapPin, Phone, Copy, CheckCheck,
  Download, Printer, ChevronRight, ExternalLink, MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockOrders, type OrderStatus, type DashboardOrder } from "@/data/mock/dashboard"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  pending:    { label: "Pending",    color: "text-amber-500",     bg: "bg-amber-500/10",      border: "border-amber-500/20",      icon: Clock       },
  confirmed:  { label: "Confirmed",  color: "text-brand-purple",  bg: "bg-brand-purple/10",   border: "border-brand-purple/20",   icon: CheckCircle2 },
  processing: { label: "Processing", color: "text-brand-indigo",  bg: "bg-brand-indigo/10",   border: "border-brand-indigo/20",   icon: Package     },
  shipped:    { label: "Shipped",    color: "text-cyan-500",      bg: "bg-cyan-500/10",       border: "border-cyan-500/20",       icon: Truck       },
  delivered:  { label: "Delivered",  color: "text-brand-green",   bg: "bg-brand-green/10",    border: "border-brand-green/20",    icon: CheckCheck  },
  cancelled:  { label: "Cancelled",  color: "text-destructive",   bg: "bg-destructive/10",    border: "border-destructive/20",    icon: XCircle     },
}

const statusFlow: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"]

const timelineLabels: Record<OrderStatus, { label: string; desc: string }> = {
  pending:    { label: "Order Placed",    desc: "Customer placed the order"           },
  confirmed:  { label: "Confirmed",       desc: "Order confirmed and payment received" },
  processing: { label: "Being Prepared",  desc: "Item is being packaged"              },
  shipped:    { label: "Out for Delivery", desc: "Handed to courier for delivery"     },
  delivered:  { label: "Delivered",       desc: "Order delivered successfully 🎉"     },
  cancelled:  { label: "Cancelled",       desc: "Order was cancelled"                 },
}

const stepIcons: Record<OrderStatus, React.ElementType> = {
  pending: Clock, confirmed: CheckCircle2, processing: Package,
  shipped: Truck, delivered: Home, cancelled: XCircle,
}

// Enrich mock orders with derived timeline data
function buildTimeline(order: DashboardOrder) {
  const idx = statusFlow.indexOf(order.status)
  const baseDate = new Date(order.createdAt)

  return statusFlow.map((s, i) => {
    const done = i <= idx && order.status !== "cancelled"
    const d = new Date(baseDate)
    d.setDate(d.getDate() + i)
    return {
      status: s,
      done,
      active: i === idx && order.status !== "cancelled",
      time: done ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + `, ${["9:00 AM", "10:30 AM", "2:15 PM", "8:00 AM", "3:45 PM"][i]}` : "",
      ...timelineLabels[s],
    }
  })
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="ml-1 p-0.5 text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const order = mockOrders.find(o => o.id === orderId || o.orderNumber === orderId)
    ?? mockOrders[0] // fallback for demo

  const status = statusConfig[order.status]
  const StatusIcon = status.icon
  const currentIdx = statusFlow.indexOf(order.status)
  const timeline = buildTimeline(order)

  const waUrl = `https://wa.me/${order.customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hi ${order.customer.name.split(" ")[0]}! Your order ${order.orderNumber} has been updated. 😊`
  )}`

  const nextStatus = statusFlow[currentIdx + 1]

  const advanceStatus = () => {
    toast({
      title: `Order marked as ${statusConfig[nextStatus]?.label}`,
      description: `${order.orderNumber} · ${order.customer.name}`,
      variant: "success",
    })
  }

  return (
    <div className="p-4 lg:p-6 max-w-[900px] mx-auto pb-24">
      {/* Back + breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
      >
        <button onClick={() => router.back()} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Orders
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground font-mono">{order.orderNumber}</span>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-2xl font-extrabold">{order.orderNumber}</h1>
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
              status.bg, status.color, status.border
            )}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
            <Download className="h-3.5 w-3.5" />
            Invoice
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="whatsapp" size="sm" className="gap-1.5 text-xs h-8">
              <MessageCircle className="h-3.5 w-3.5 fill-white" />
              WhatsApp
            </Button>
          </a>
          {nextStatus && order.status !== "cancelled" && (
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={advanceStatus}>
              Mark as {statusConfig[nextStatus]?.label}
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Status stepper */}
          {order.status !== "cancelled" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h2 className="font-semibold text-sm mb-5">Order Progress</h2>
              <div className="flex items-start justify-between relative">
                {/* Connecting line */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-border z-0">
                  <div
                    className="h-full bg-brand-purple transition-all duration-700"
                    style={{ width: currentIdx < 0 ? "0%" : `${(currentIdx / (statusFlow.length - 1)) * 100}%` }}
                  />
                </div>
                {statusFlow.map((s, i) => {
                  const StepIcon = stepIcons[s]
                  const done = i <= currentIdx
                  const active = i === currentIdx
                  return (
                    <div key={s} className="relative z-10 flex flex-col items-center gap-1.5">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                        done ? "border-brand-purple bg-brand-purple text-white" : "border-border bg-background text-muted-foreground"
                      )}>
                        <StepIcon className={cn("h-3.5 w-3.5", active && "animate-pulse")} />
                      </div>
                      <span className={cn(
                        "text-[10px] font-semibold text-center max-w-[60px] leading-tight hidden sm:block",
                        done ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {timelineLabels[s].label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Product card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h2 className="font-semibold text-sm mb-4">Order Items</h2>
            <div className="flex gap-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                <Image src={order.product.image} alt={order.product.name} fill className="object-cover" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-snug">{order.product.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Qty: 1</p>
                <p className="font-display font-bold text-brand-purple mt-2 text-lg">₦{order.amount.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">₦{order.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery fee</span>
                <span className="font-semibold">₦1,500</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-bold">Total</span>
                <span className="font-display font-extrabold text-brand-purple">₦{(order.amount + 1500).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h2 className="font-semibold text-sm mb-4">Timeline</h2>
            <div className="space-y-4">
              {timeline.map((event, i) => {
                const isLast = i === timeline.length - 1
                return (
                  <div key={event.status} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                        event.done ? "border-brand-purple bg-brand-purple" : "border-border bg-background"
                      )}>
                        {event.done && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      {!isLast && (
                        <div className={cn("w-0.5 flex-1 mt-1 min-h-[24px]", event.done ? "bg-brand-purple/30" : "bg-border")} />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-xs font-semibold", !event.done && "text-muted-foreground")}>{event.label}</p>
                        {event.time && <p className="text-[10px] text-muted-foreground flex-shrink-0">{event.time}</p>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{event.desc}</p>
                    </div>
                  </div>
                )
              })}
              {order.status === "cancelled" && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full border-2 border-destructive bg-destructive flex items-center justify-center">
                    <XCircle className="h-3 w-3 text-white" />
                  </div>
                  <div className="pb-4">
                    <p className="text-xs font-semibold text-destructive">Cancelled</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Order was cancelled</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right column: sidebar */}
        <div className="space-y-5">

          {/* Customer */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h2 className="font-semibold text-sm mb-4">Customer</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-brand-purple">{order.customer.name.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight">{order.customer.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {order.customer.phone}
                  <CopyButton text={order.customer.phone} />
                </p>
              </div>
            </div>
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full h-9 rounded-xl bg-[#25D366] hover:bg-[#20b958] text-white text-xs font-semibold transition-colors">
              <MessageCircle className="h-4 w-4 fill-white" />
              Message on WhatsApp
            </a>
          </motion.div>

          {/* Delivery */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h2 className="font-semibold text-sm mb-3">Delivery Address</h2>
            <div className="flex gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">{order.deliveryAddress}</p>
            </div>
          </motion.div>

          {/* Payment */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h2 className="font-semibold text-sm mb-3">Payment</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-semibold capitalize">
                  {order.source === "whatsapp" ? "WhatsApp Pay" : "Direct transfer"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={cn("font-semibold", order.status === "cancelled" ? "text-destructive" : "text-brand-green")}>
                  {order.status === "cancelled" ? "Refunded" : "Paid"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono font-semibold text-[11px] flex items-center gap-1">
                  {order.orderNumber}
                  <CopyButton text={order.orderNumber} />
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-bold">Total paid</span>
                <span className="font-display font-extrabold text-brand-purple">
                  ₦{(order.amount + 1500).toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl border border-border bg-card p-4 space-y-1"
          >
            {[
              { label: "View customer profile", icon: ExternalLink, href: "#" },
              { label: "View invoice", icon: ExternalLink, href: "#" },
              { label: "All orders from customer", icon: MoreHorizontal, href: "#" },
            ].map(({ label, icon: Icon, href }) => (
              <Link key={label} href={href}
                className="flex items-center justify-between py-2 px-1 rounded-xl hover:bg-accent transition-colors group">
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
