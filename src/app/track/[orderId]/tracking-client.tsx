"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  CheckCircle2, Clock, Package, Truck, Home, MessageCircle,
  Share2, CheckCheck, ArrowLeft, MapPin, Phone, Copy,
} from "lucide-react"
import { formatMoney } from "@/lib/globalization"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type OrderStatus = "confirmed" | "processing" | "shipped" | "delivered"

export interface TrackingOrder {
  id: string
  status: OrderStatus
  product: { name: string; image: string; price: number; qty: number }
  seller: { name: string; phone: string; handle: string }
  customer: { name: string; address: string }
  timeline: { status: OrderStatus; label: string; desc: string; time: string; done: boolean }[]
  estimatedDelivery: string
  courier: string
  trackingRef: string
}

const STEPS: { status: OrderStatus; icon: React.ElementType; label: string }[] = [
  { status: "confirmed",  icon: CheckCircle2, label: "Confirmed"  },
  { status: "processing", icon: Package,      label: "Processing" },
  { status: "shipped",    icon: Truck,        label: "Shipped"    },
  { status: "delivered",  icon: Home,         label: "Delivered"  },
]

const statusOrder: OrderStatus[] = ["confirmed", "processing", "shipped", "delivered"]

function getMockOrder(orderId: string): TrackingOrder {
  const statusMap: Record<string, OrderStatus> = {
    "LM1001": "delivered",
    "LM1002": "shipped",
    "LM1003": "processing",
  }
  const status = statusMap[orderId] ?? "confirmed"
  const idx = statusOrder.indexOf(status)

  return {
    id: orderId,
    status,
    product: {
      name: "Ankara Print Peplum Top",
      image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80",
      price: 18500,
      qty: 1,
    },
    seller: {
      name: "Your Store",
      phone: "+2348034567890",
      handle: "your-store",
    },
    customer: {
      name: "Amaka O.",
      address: "14 Palm Avenue, Lekki Phase 1, Lagos",
    },
    estimatedDelivery: status === "delivered" ? "Delivered May 3" : "Estimated May 8–10",
    courier: "GIG Logistics",
    trackingRef: `GIG${orderId}88`,
    timeline: [
      {
        status: "confirmed",
        label: "Order Confirmed",
        desc: "Your order has been received and payment confirmed.",
        time: "May 1, 2:14 PM",
        done: idx >= 0,
      },
      {
        status: "processing",
        label: "Being Prepared",
        desc: "Your Store is packaging your item.",
        time: idx >= 1 ? "May 2, 10:30 AM" : "",
        done: idx >= 1,
      },
      {
        status: "shipped",
        label: "Out for Delivery",
        desc: `Picked up by ${idx >= 2 ? "GIG Logistics" : "—"}. Ref: GIG${orderId}88`,
        time: idx >= 2 ? "May 3, 8:00 AM" : "",
        done: idx >= 2,
      },
      {
        status: "delivered",
        label: "Delivered",
        desc: "Your order has been delivered. Enjoy! 🎉",
        time: idx >= 3 ? "May 3, 3:45 PM" : "",
        done: idx >= 3,
      },
    ],
  }
}

const CONFETTI_EMOJIS = ["🎉", "🎊", "✨", "💜", "🛍️", "⭐"]

function DeliveredCelebration() {
  const [particles] = React.useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
      x: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.2 + Math.random() * 0.8,
    }))
  )

  return (
    <div className="absolute inset-x-0 top-0 h-32 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, scale: 0.5 }}
          animate={{ y: 120, opacity: 0, scale: 1.2 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          className="absolute text-xl"
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  )
}

export function TrackingClient({ orderId, initialOrder }: { orderId: string; initialOrder: TrackingOrder | null }) {
  const [copied, setCopied] = React.useState(false)

  if (!initialOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <p className="text-4xl mb-4">📦</p>
        <h1 className="font-display text-xl font-bold mb-2">Order not found</h1>
        <p className="text-sm text-muted-foreground mb-6">We couldn&apos;t find order <code className="font-mono bg-muted px-1 rounded">{orderId}</code>. Check the link and try again.</p>
        <a href="/" className="text-sm text-brand-purple font-semibold hover:underline">Back to home</a>
      </div>
    )
  }
  const order = initialOrder
  const currentIdx = statusOrder.indexOf(order.status)

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: "Order Tracking", url }).catch(() => {})
      return
    }
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const whatsappUrl = `https://wa.me/${order.seller.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hi! I'm tracking order ${order.id} — ${order.product.name}. Can you give me an update? 🙏`
  )}`

  return (
    <div className="min-h-screen bg-background relative">
      {order.status === "delivered" && <DeliveredCelebration />}

      {/* Header */}
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between px-4 bg-background/90 backdrop-blur-sm border-b border-border">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Lummy
        </Link>
        <button onClick={handleShare} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border hover:bg-accent transition-colors">
          {copied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Share2 className="h-3.5 w-3.5" />}
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
        {/* Order ID + status */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="text-center">
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-3",
            order.status === "delivered" ? "bg-brand-green/10 text-brand-green" : "bg-brand-purple/10 text-brand-purple"
          )}>
            {order.status === "delivered"
              ? <><CheckCircle2 className="h-4 w-4" /> Delivered</>
              : <><Clock className="h-4 w-4" /> {STEPS.find(s => s.status === order.status)?.label}</>
            }
          </div>
          <h1 className="font-display text-2xl font-extrabold">Order #{order.id}</h1>
          <p className="text-sm text-muted-foreground mt-1">{order.estimatedDelivery}</p>
        </motion.div>

        {/* Status stepper */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-border z-0">
              <div
                className="h-full bg-brand-purple transition-all duration-700"
                style={{ width: `${(currentIdx / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
            {STEPS.map((step, i) => {
              const Icon = step.icon
              const done = i <= currentIdx
              const active = i === currentIdx
              return (
                <div key={step.status} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                    done
                      ? "border-brand-purple bg-brand-purple text-white"
                      : "border-border bg-background text-muted-foreground"
                  )}>
                    <Icon className={cn("h-3.5 w-3.5", active && "animate-pulse")} />
                  </div>
                  <span className={cn("text-[10px] font-semibold text-center max-w-[56px] leading-tight", done ? "text-foreground" : "text-muted-foreground")}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Product card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="rounded-2xl border border-border bg-card p-4 flex gap-3">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
            <Image src={order.product.image} alt={order.product.name} fill className="object-cover" unoptimized />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-snug">{order.product.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Qty: {order.product.qty}</p>
            <p className="font-display font-bold text-brand-purple mt-1">{formatMoney(order.product.price)}</p>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
          className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold text-sm mb-4">Timeline</h2>
          <div className="space-y-4">
            {order.timeline.map((event, i) => {
              const isLast = i === order.timeline.length - 1
              return (
                <div key={event.status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      event.done ? "border-brand-purple bg-brand-purple" : "border-border bg-background"
                    )}>
                      {event.done && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    {!isLast && <div className={cn("w-0.5 flex-1 mt-1 min-h-[24px]", event.done ? "bg-brand-purple/30" : "bg-border")} />}
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
          </div>
        </motion.div>

        {/* Delivery + courier details */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-sm">Delivery Details</h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground mb-0.5">Courier</p>
              <p className="font-semibold">{order.courier}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Tracking ref</p>
              <div className="flex items-center gap-1">
                <p className="font-semibold font-mono">{order.trackingRef}</p>
                <button onClick={() => { navigator.clipboard.writeText(order.trackingRef) }}>
                  <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-border flex items-start gap-2 text-xs">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-muted-foreground mb-0.5">Delivering to</p>
              <p className="font-semibold">{order.customer.name}</p>
              <p className="text-muted-foreground">{order.customer.address}</p>
            </div>
          </div>
        </motion.div>

        {/* Seller */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Link href={`/${order.seller.handle}`}
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-accent transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-brand-purple">{order.seller.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{order.seller.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3" /> {order.seller.phone}
              </p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Leave a review CTA (delivered only) */}
      {order.status === "delivered" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
          className="mx-4 mb-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Enjoying your order?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Help other shoppers — leave a quick review ⭐</p>
          </div>
          <a href={`https://wa.me/${order.seller.phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Hi! I just received my order (${order.id}) and I'd like to leave a review 🌟`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-500/90 transition-colors flex-shrink-0">
            Rate it
          </a>
        </motion.div>
      )}

      {/* Sticky WhatsApp CTA */}
      <div className="fixed bottom-0 inset-x-0 z-20 p-4 bg-background/90 backdrop-blur-sm border-t border-border">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="whatsapp" size="xl" className="w-full gap-2">
            <MessageCircle className="h-5 w-5 fill-white" />
            Contact seller on WhatsApp
          </Button>
        </a>
      </div>
    </div>
  )
}
