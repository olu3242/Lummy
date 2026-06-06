"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Package, CheckCircle2, Clock, Truck, Home,
  XCircle, MessageCircle, MapPin, Phone, Copy, CheckCheck,
  Download, Printer, ChevronRight, ExternalLink, MoreHorizontal,
  AlertTriangle, RefreshCw, Flag, Send, FileText, Star,
  ChevronDown, ChevronUp, Image as ImageIcon, X, Plus, Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockOrders, type OrderStatus, type DashboardOrder } from "@/data/mock/dashboard"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { formatMoney } from "@/lib/globalization"

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
  pending:    { label: "Order Placed",      desc: "Customer placed the order"           },
  confirmed:  { label: "Confirmed",         desc: "Order confirmed and payment received" },
  processing: { label: "Being Prepared",    desc: "Item is being packaged"              },
  shipped:    { label: "Out for Delivery",  desc: "Handed to courier for delivery"      },
  delivered:  { label: "Delivered",         desc: "Order delivered successfully 🎉"     },
  cancelled:  { label: "Cancelled",         desc: "Order was cancelled"                 },
}

const stepIcons: Record<OrderStatus, React.ElementType> = {
  pending: Clock, confirmed: CheckCircle2, processing: Package,
  shipped: Truck, delivered: Home, cancelled: XCircle,
}

interface ActivityEntry {
  id: string
  actor: "system" | "seller"
  action: string
  time: string
}

interface SellerNote {
  id: string
  text: string
  time: string
}

const NOTES_KEY = "lummy_order_notes"

function loadNotes(orderId: string): SellerNote[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(`${NOTES_KEY}_${orderId}`)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveNotes(orderId: string, notes: SellerNote[]) {
  try { localStorage.setItem(`${NOTES_KEY}_${orderId}`, JSON.stringify(notes)) } catch {}
}

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

function buildActivity(order: DashboardOrder): ActivityEntry[] {
  const idx = statusFlow.indexOf(order.status)
  const base = new Date(order.createdAt)
  const entries: ActivityEntry[] = []

  entries.push({ id: "a0", actor: "system", action: "Order placed by customer", time: base.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) })

  statusFlow.slice(0, idx + 1).forEach((s, i) => {
    if (i === 0) return
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    entries.push({
      id: `a${i}`,
      actor: "seller",
      action: `Status changed to "${statusConfig[s].label}"`,
      time: d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    })
  })

  return entries.reverse()
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

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = React.useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110">
          <Star className={cn("h-5 w-5", (hovered || value) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  )
}

function CancelConfirmModal({ order, onConfirm, onClose }: {
  order: DashboardOrder
  onConfirm: () => void
  onClose: () => void
}) {
  const [reason, setReason] = React.useState("")
  const reasons = ["Customer requested", "Out of stock", "Incorrect order", "Duplicate order", "Other"]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-sm bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-bold text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-brand-coral" /> Cancel Order
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">Cancelling <span className="font-semibold text-foreground">{order.orderNumber}</span> for <span className="font-semibold text-foreground">{order.customer.name}</span>. This cannot be undone.</p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Reason</label>
            <div className="grid grid-cols-2 gap-1.5">
              {reasons.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={cn("h-8 rounded-xl border text-xs font-semibold transition-all text-left px-3",
                    reason === r ? "border-brand-coral/30 bg-brand-coral/10 text-brand-coral" : "border-border hover:bg-muted text-muted-foreground")}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Keep Order</Button>
            <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => { onConfirm(); onClose() }}>
              Cancel Order
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function RescheduleModal({ onSave, onClose }: { onSave: (date: string) => void; onClose: () => void }) {
  const [date, setDate] = React.useState("")
  const [slot, setSlot] = React.useState("morning")

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-xs bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-bold text-sm flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-brand-purple" /> Reschedule Delivery
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1.5">New delivery date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5">Time slot</label>
            <div className="grid grid-cols-3 gap-1.5">
              {["Morning", "Afternoon", "Evening"].map(s => (
                <button key={s} onClick={() => setSlot(s.toLowerCase())}
                  className={cn("h-8 rounded-xl border text-xs font-semibold transition-all",
                    slot === s.toLowerCase() ? "border-brand-purple/30 bg-brand-purple/10 text-brand-purple" : "border-border hover:bg-muted text-muted-foreground")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={() => {
              if (!date) { toast({ title: "Pick a delivery date" }); return }
              onSave(`${date} (${slot})`); onClose()
              toast({ title: "Delivery rescheduled!", variant: "success" })
            }}>Save</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const mockFallback = mockOrders.find(o => o.id === orderId || o.orderNumber === orderId) ?? null
  const [order, setOrder] = React.useState<DashboardOrder>(mockFallback ?? mockOrders[0])
  const [orderLoading, setOrderLoading] = React.useState(!mockFallback)

  React.useEffect(() => {
    if (mockFallback) return
    fetch(`/api/orders/${orderId}`)
      .then(r => r.ok ? r.json() : null)
      .then((res: { data?: { id: string; status: string; amount: number; currency: string; created_at: string; customer_name?: string; customer_phone?: string; customer_address?: string; payment_provider?: string } } | null) => {
        if (!res?.data) return
        const d = res.data
        const statusMap: Record<string, OrderStatus> = { pending: "pending", confirmed: "confirmed", processing: "processing", shipped: "shipped", delivered: "delivered", cancelled: "cancelled" }
        setOrder({
          id: d.id,
          orderNumber: d.id.slice(0, 8).toUpperCase(),
          customer: { name: d.customer_name ?? "Customer", phone: d.customer_phone ?? "" },
          product: { name: "Order", image: "" },
          amount: d.amount,
          currency: d.currency ?? "NGN",
          status: statusMap[d.status] ?? "pending",
          source: (d.payment_provider as DashboardOrder["source"]) ?? "direct",
          createdAt: d.created_at,
          deliveryAddress: d.customer_address ?? "",
        })
      })
      .catch(() => {})
      .finally(() => setOrderLoading(false))
  }, [orderId, mockFallback])

  const [currentStatus, setCurrentStatus] = React.useState<OrderStatus>(order.status)

  React.useEffect(() => {
    setCurrentStatus(order.status)
  }, [order.status])
  const [notes, setNotes] = React.useState<SellerNote[]>([])
  const [noteText, setNoteText] = React.useState("")
  const [rating, setRating] = React.useState(0)
  const [flagged, setFlagged] = React.useState(false)
  const [activityOpen, setActivityOpen] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false)
  const [rescheduleDate, setRescheduleDate] = React.useState<string | null>(null)
  const [proofUploaded, setProofUploaded] = React.useState(false)
  const [moreOpen, setMoreOpen] = React.useState(false)

  React.useEffect(() => {
    setNotes(loadNotes(order.id))
  }, [order.id])

  const status = statusConfig[currentStatus]
  const StatusIcon = status.icon
  const currentIdx = statusFlow.indexOf(currentStatus)
  const timeline = buildTimeline({ ...order, status: currentStatus })
  const activity = buildActivity({ ...order, status: currentStatus })

  const waUrl = `https://wa.me/${order.customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hi ${order.customer.name.split(" ")[0]}! Your order ${order.orderNumber} has been updated. 😊`
  )}`

  const nextStatus = statusFlow[currentIdx + 1]

  const advanceStatus = () => {
    if (!nextStatus) return
    setCurrentStatus(nextStatus)
    toast({
      title: `Order marked as ${statusConfig[nextStatus]?.label}`,
      description: `${order.orderNumber} · ${order.customer.name}`,
      variant: "success",
    })
  }

  const addNote = () => {
    if (!noteText.trim()) return
    const newNote: SellerNote = {
      id: `n${Date.now()}`,
      text: noteText.trim(),
      time: new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    }
    const updated = [newNote, ...notes]
    setNotes(updated)
    saveNotes(order.id, updated)
    setNoteText("")
    toast({ title: "Note saved", variant: "success" })
  }

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    saveNotes(order.id, updated)
  }

  const handleCancel = () => {
    setCurrentStatus("cancelled")
    toast({ title: "Order cancelled", description: order.orderNumber, variant: "error" })
  }

  const otherOrders = mockFallback
    ? mockOrders.filter(o => o.customer.name === order.customer.name && o.id !== order.id).slice(0, 3)
    : []

  if (orderLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading order…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-[960px] mx-auto pb-24">
      {/* Back + breadcrumb */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Orders
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground font-mono">{order.orderNumber}</span>
        {flagged && <Badge variant="destructive" size="sm" className="ml-1">Flagged</Badge>}
      </motion.div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
            {rescheduleDate && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                📅 {rescheduleDate}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => toast({ title: "Invoice downloaded" })}>
            <Download className="h-3.5 w-3.5" /> Invoice
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => toast({ title: "Sent to printer" })}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="whatsapp" size="sm" className="gap-1.5 text-xs h-8">
              <MessageCircle className="h-3.5 w-3.5 fill-white" /> WhatsApp
            </Button>
          </a>
          {nextStatus && currentStatus !== "cancelled" && (
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={advanceStatus}>
              Mark as {statusConfig[nextStatus]?.label}
            </Button>
          )}

          {/* More dropdown */}
          <div className="relative">
            <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setMoreOpen(o => !o)}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 top-10 z-30 w-48 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                  {[
                    { label: "Reschedule delivery", icon: RefreshCw, action: () => { setRescheduleOpen(true); setMoreOpen(false) } },
                    { label: flagged ? "Unflag order" : "Flag order", icon: Flag, action: () => { setFlagged(f => !f); setMoreOpen(false); toast({ title: flagged ? "Flag removed" : "Order flagged" }) } },
                    { label: "Resend confirmation", icon: Send, action: () => { setMoreOpen(false); toast({ title: "Confirmation resent!", variant: "success" }) } },
                  ].map(({ label, icon: Icon, action }) => (
                    <button key={label} onClick={action}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold hover:bg-muted transition-colors text-left">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />{label}
                    </button>
                  ))}
                  {currentStatus !== "cancelled" && currentStatus !== "delivered" && (
                    <button onClick={() => { setCancelOpen(true); setMoreOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold hover:bg-destructive/10 text-destructive transition-colors text-left border-t border-border">
                      <XCircle className="h-3.5 w-3.5" /> Cancel order
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Status stepper */}
          {currentStatus !== "cancelled" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold text-sm mb-5">Order Progress</h2>
              <div className="flex items-start justify-between relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-border z-0">
                  <div className="h-full bg-brand-purple transition-all duration-700"
                    style={{ width: currentIdx < 0 ? "0%" : `${(currentIdx / (statusFlow.length - 1)) * 100}%` }} />
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
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold text-sm mb-4">Order Items</h2>
            <div className="flex gap-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                <Image src={order.product.image} alt={order.product.name} fill className="object-cover" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-snug">{order.product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Qty: 1</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Size: M</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Black</span>
                </div>
                <p className="font-display font-bold text-brand-purple mt-2 text-lg">{formatMoney(order.amount, order.currency ?? "USD")}</p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatMoney(order.amount, order.currency ?? "USD")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery fee</span>
                <span className="font-semibold">{formatMoney(5, order.currency ?? "USD")}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-bold">Total</span>
                <span className="font-display font-extrabold text-brand-purple">{formatMoney(order.amount + 5, order.currency ?? "USD")}</span>
              </div>
            </div>
          </motion.div>

          {/* Proof of delivery */}
          {(currentStatus === "shipped" || currentStatus === "delivered") && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-brand-purple" /> Proof of Delivery
              </h2>
              {proofUploaded ? (
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-brand-green" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-brand-green">Photo uploaded</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">delivery-proof.jpg · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                    <button onClick={() => setProofUploaded(false)} className="text-[10px] text-brand-coral hover:underline mt-1">Remove</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setProofUploaded(true); toast({ title: "Proof uploaded!", variant: "success" }) }}
                  className="w-full h-20 rounded-xl border-2 border-dashed border-border hover:border-brand-purple/40 hover:bg-brand-purple/5 flex flex-col items-center justify-center gap-1.5 transition-all">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload delivery photo</span>
                </button>
              )}
            </motion.div>
          )}

          {/* Customer rating (delivered orders) */}
          {currentStatus === "delivered" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
              className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" /> Customer Rating
              </h2>
              {rating === 0 ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Log the customer&apos;s rating for this order.</p>
                  <StarRating value={rating} onChange={v => { setRating(v); toast({ title: `Rating saved: ${v}/5 ⭐`, variant: "success" }) }} />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <StarRating value={rating} onChange={setRating} />
                  <span className="text-sm font-bold">{rating}/5</span>
                  <button onClick={() => setRating(0)} className="text-[10px] text-muted-foreground hover:text-foreground">Clear</button>
                </div>
              )}
            </motion.div>
          )}

          {/* Timeline */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border bg-card p-5">
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
              {currentStatus === "cancelled" && (
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

          {/* Activity log */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="rounded-2xl border border-border bg-card overflow-hidden">
            <button onClick={() => setActivityOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
              <h2 className="font-semibold text-sm">Activity Log</h2>
              {activityOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            <AnimatePresence>
              {activityOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="border-t border-border divide-y divide-border">
                    {activity.map(entry => (
                      <div key={entry.id} className="flex items-start gap-3 px-5 py-3">
                        <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1.5", entry.actor === "system" ? "bg-muted-foreground" : "bg-brand-purple")} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold">{entry.action}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{entry.actor === "seller" ? "You" : "System"} · {entry.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Seller notes */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-purple" /> Seller Notes
              {notes.length > 0 && <span className="text-xs text-muted-foreground font-normal">({notes.length})</span>}
            </h2>
            <div className="flex gap-2 mb-4">
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2}
                placeholder="Add a private note about this order…"
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none" />
              <button onClick={addNote} disabled={!noteText.trim()}
                className="flex-shrink-0 px-3 rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white text-xs font-semibold transition-colors disabled:opacity-40">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {notes.length > 0 && (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {notes.map(note => (
                    <motion.div key={note.id}
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="group flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border">
                      <Pencil className="h-3 w-3 text-brand-purple flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed">{note.text}</p>
                        <p className="text-[9px] text-muted-foreground mt-1">{note.time}</p>
                      </div>
                      <button onClick={() => deleteNote(note.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                        <X className="h-3 w-3 text-muted-foreground hover:text-brand-coral" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            {notes.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No notes yet — add one above</p>
            )}
          </motion.div>
        </div>

        {/* Right column: sidebar */}
        <div className="space-y-5">

          {/* Customer */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-5">
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
              className="flex items-center justify-center gap-1.5 w-full h-9 rounded-xl bg-[#25D366] hover:bg-[#20b958] text-white text-xs font-semibold transition-colors mb-2">
              <MessageCircle className="h-4 w-4 fill-white" /> Message on WhatsApp
            </a>
            <Link href={`/dashboard/customers/${order.id}`}
              className="flex items-center justify-center gap-1 w-full h-8 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors text-muted-foreground">
              View full profile <ExternalLink className="h-3 w-3" />
            </Link>

            {/* Other orders from this customer */}
            {otherOrders.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Other orders</p>
                <div className="space-y-1.5">
                  {otherOrders.map(o => {
                    const s = statusConfig[o.status]
                    return (
                      <Link key={o.id} href={`/dashboard/orders/${o.id}`}
                        className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-muted transition-colors">
                        <span className="text-xs font-mono font-semibold">{o.orderNumber}</span>
                        <span className={cn("text-[10px] font-semibold", s.color)}>{s.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* Delivery */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Delivery Address</h2>
              {rescheduleDate && (
                <span className="text-[10px] text-cyan-600 font-semibold">Rescheduled</span>
              )}
            </div>
            <div className="flex gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">{order.deliveryAddress}</p>
            </div>
            {rescheduleDate && (
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs">
                <RefreshCw className="h-3 w-3 text-cyan-500" />
                <span className="text-muted-foreground">New delivery: <span className="font-semibold text-foreground">{rescheduleDate}</span></span>
              </div>
            )}
          </motion.div>

          {/* Payment */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-5">
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
                <span className={cn("font-semibold", currentStatus === "cancelled" ? "text-destructive" : "text-brand-green")}>
                  {currentStatus === "cancelled" ? "Refunded" : "Paid"}
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
                <span className="font-display font-extrabold text-brand-purple">{formatMoney(order.amount + 5, order.currency ?? "USD")}</span>
              </div>
            </div>
          </motion.div>

          {/* Quick links */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-2xl border border-border bg-card p-4 space-y-1">
            {[
              { label: "View invoice", icon: ExternalLink, onClick: () => toast({ title: "Invoice opened" }) },
              { label: "Resend confirmation", icon: Send, onClick: () => toast({ title: "Confirmation resent!", variant: "success" as const }) },
              { label: "All orders from customer", icon: MoreHorizontal, onClick: () => {} },
            ].map(({ label, icon: Icon, onClick }) => (
              <button key={label} onClick={onClick}
                className="w-full flex items-center justify-between py-2 px-1 rounded-xl hover:bg-accent transition-colors group">
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {cancelOpen && (
          <CancelConfirmModal key="cancel" order={order} onConfirm={handleCancel} onClose={() => setCancelOpen(false)} />
        )}
        {rescheduleOpen && (
          <RescheduleModal key="reschedule" onSave={d => setRescheduleDate(d)} onClose={() => setRescheduleOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
