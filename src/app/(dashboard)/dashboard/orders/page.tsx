"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Download, Plus, MessageCircle, Instagram, Link2, Music,
  Filter, MapPin, Package, CheckCheck, Clock, Truck, XCircle,
  ChevronRight, TrendingUp, ShoppingBag, BarChart3, ArrowUpDown,
  ChevronDown, ChevronUp, CheckSquare, Square, X, Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from "@/components/ui/sheet"
import { type OrderStatus, type DashboardOrder } from "@/data/mock/dashboard"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const statusConfig: Record<OrderStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending:    { label: "Pending",    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",          icon: Clock      },
  confirmed:  { label: "Confirmed",  className: "bg-brand-purple/10 text-brand-purple border-brand-purple/20", icon: CheckCheck },
  processing: { label: "Processing", className: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20", icon: Package    },
  shipped:    { label: "Shipped",    className: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",             icon: Truck      },
  delivered:  { label: "Delivered",  className: "bg-brand-green/10 text-brand-green border-brand-green/20",   icon: CheckCheck },
  cancelled:  { label: "Cancelled",  className: "bg-destructive/10 text-destructive border-destructive/20",   icon: XCircle    },
}

const statusFlow: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"]

const sourceIcon: Record<string, React.ElementType> = {
  whatsapp: MessageCircle, instagram: Instagram, direct: Link2, tiktok: Music,
}
const sourceColor: Record<string, string> = {
  whatsapp: "text-[#25D366]", instagram: "text-pink-400", direct: "text-brand-purple", tiktok: "text-red-400",
}
const sourceHex: Record<string, string> = {
  whatsapp: "#25D366", instagram: "#E1306C", direct: "#6C4EF3", tiktok: "#EE1D52",
}

const tabValues = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"] as const
type SortCol = "date" | "amount" | "status"
type SortDir = "asc" | "desc"

// ── Revenue sparkline (7 days) ───────────────────────────────────────────────
const DAILY_REVENUE = [42000, 67500, 38000, 91000, 55000, 84000, 112500]

function RevSparkline() {
  const max = Math.max(...DAILY_REVENUE)
  const W = 80, H = 28, pts = DAILY_REVENUE.map((v, i) => [
    Math.round((i / (DAILY_REVENUE.length - 1)) * W),
    Math.round(H - (v / max) * (H - 4)),
  ])
  const polyline = pts.map(([x, y]) => `${x},${y}`).join(" ")
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={polyline} fill="none" stroke="#6C4EF3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3} fill="#6C4EF3" />
    </svg>
  )
}

// ── Source breakdown mini chart ───────────────────────────────────────────────
function SourceBreakdown({ orders }: { orders: DashboardOrder[] }) {
  const counts: Record<string, number> = {}
  orders.forEach(o => { counts[o.source] = (counts[o.source] ?? 0) + 1 })
  const total = orders.length || 1
  const sources = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-3.5 w-3.5 text-brand-purple" />
        <p className="text-xs font-semibold">Order Sources</p>
      </div>
      <div className="space-y-2">
        {sources.map(([src, count]) => {
          const Icon = sourceIcon[src] ?? Link2
          const pct = Math.round((count / total) * 100)
          return (
            <div key={src}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="flex items-center gap-1.5 text-[10px] font-medium capitalize">
                  <Icon className={cn("h-3 w-3", sourceColor[src])} />{src}
                </span>
                <span className="text-[10px] font-semibold">{count} ({pct}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", damping: 20, delay: 0.1 }}
                  className="h-full rounded-full" style={{ background: sourceHex[src] ?? "#6C4EF3" }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Status Timeline ───────────────────────────────────────────────────────────
function StatusTimeline({ current }: { current: OrderStatus }) {
  if (current === "cancelled") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
        <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
        <p className="text-sm font-semibold text-destructive">Order cancelled</p>
      </div>
    )
  }
  const currentIdx = statusFlow.indexOf(current)
  return (
    <div className="space-y-0">
      {statusFlow.map((s, i) => {
        const done = i <= currentIdx; const isCurrent = i === currentIdx
        const cfg = statusConfig[s]; const Icon = cfg.icon
        return (
          <div key={s} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-full border-2 flex-shrink-0 transition-colors",
                done ? "border-brand-purple bg-brand-purple" : "border-border bg-background")}>
                <Icon className={cn("h-3 w-3", done ? "text-white" : "text-muted-foreground")} />
              </div>
              {i < statusFlow.length - 1 && (
                <div className={cn("w-0.5 h-6 my-0.5 transition-colors", done && i < currentIdx ? "bg-brand-purple" : "bg-border")} />
              )}
            </div>
            <div className="pb-4 pt-1 min-w-0">
              <p className={cn("text-xs font-semibold capitalize", isCurrent ? "text-brand-purple" : done ? "text-foreground" : "text-muted-foreground")}>{s}</p>
              {isCurrent && <p className="text-[10px] text-muted-foreground mt-0.5">Current status</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function buildWhatsAppUpdate(order: DashboardOrder, newStatus: OrderStatus): string {
  const firstName = order.customer.name.split(" ")[0]
  const msgs: Partial<Record<OrderStatus, string>> = {
    confirmed:  `Hi ${firstName}! ✅ Your order (${order.orderNumber}) for *${order.product.name}* has been confirmed. We'll start processing it right away!`,
    processing: `Hi ${firstName}! 📦 We're now preparing your order (${order.orderNumber}). We'll notify you once it's shipped!`,
    shipped:    `Hi ${firstName}! 🚚 Great news! Your order (${order.orderNumber}) is on its way via GIG Logistics. Estimated delivery: 1–3 business days.`,
    delivered:  `Hi ${firstName}! 🎉 Your order (${order.orderNumber}) has been delivered! We hope you love it. Please leave us a review! 💜`,
  }
  const text = msgs[newStatus] ?? `Hi ${firstName}! Your order (${order.orderNumber}) status: ${newStatus}.`
  return `https://wa.me/${order.customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`
}

// ── Order Detail Drawer ───────────────────────────────────────────────────────
function OrderDetailDrawer({ order, onClose, onStatusChange }: {
  order: DashboardOrder | null; onClose: () => void
  onStatusChange: (id: string, status: OrderStatus) => void
}) {
  const [localStatus, setLocalStatus]     = React.useState<OrderStatus | null>(null)
  const [updateSaved, setUpdateSaved]     = React.useState(false)
  const [trackingNumber, setTrackingNumber] = React.useState("")
  const [trackingSaved, setTrackingSaved] = React.useState(false)
  const [orderNote, setOrderNote]         = React.useState("")

  React.useEffect(() => {
    if (order) { setLocalStatus(order.status); setUpdateSaved(false); setTrackingNumber(""); setTrackingSaved(false); setOrderNote("") }
  }, [order])

  if (!order) return null
  const currentStatus = localStatus ?? order.status
  const cfg = statusConfig[currentStatus]
  const StatusIcon = cfg.icon
  const currentIdx = statusFlow.indexOf(currentStatus)
  const nextStatus = currentIdx >= 0 && currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null
  const SourceIcon = sourceIcon[order.source]

  const handleAdvanceStatus = () => {
    if (!nextStatus) return
    setLocalStatus(nextStatus)
    setUpdateSaved(true)
    onStatusChange(order.id, nextStatus)
    setTimeout(() => setUpdateSaved(false), 2500)
  }

  return (
    <Sheet open={!!order} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {order.orderNumber}
            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", cfg.className)}>
              {cfg.label}
            </span>
          </SheetTitle>
          <SheetDescription>{order.createdAt} · via {order.source}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-5">
          {/* Customer */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Customer</p>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border">
              <div className="w-9 h-9 rounded-xl bg-brand-purple/10 flex items-center justify-center text-sm font-bold text-brand-purple flex-shrink-0">
                {order.customer.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{order.customer.name}</p>
                <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
              </div>
              <a href={`https://wa.me/${order.customer.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors flex-shrink-0">
                <MessageCircle className="h-3.5 w-3.5 fill-[#25D366]" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Product ordered</p>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                <Image src={order.product.image} alt={order.product.name} fill className="object-cover" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{order.product.name}</p>
                <p className="font-display font-bold text-brand-purple">₦{order.amount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Delivery address</p>
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-border">
              <MapPin className="h-4 w-4 text-brand-purple flex-shrink-0 mt-0.5" />
              <p className="text-sm">{order.deliveryAddress}</p>
            </div>
          </div>

          {/* Source */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <SourceIcon className={cn("h-3.5 w-3.5", sourceColor[order.source])} />
            <span>Order came via <span className="font-semibold capitalize text-foreground">{order.source}</span></span>
          </div>

          {/* Status timeline */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Order progress</p>
            <StatusTimeline current={currentStatus} />
          </div>

          {/* Tracking number */}
          {(currentStatus === "shipped" || currentStatus === "delivered") && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tracking number</p>
              <div className="flex gap-2">
                <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="e.g. GIG-8812993"
                  className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                <button onClick={() => { if (trackingNumber.trim()) { setTrackingSaved(true); setTimeout(() => setTrackingSaved(false), 2500) } }}
                  className="h-9 px-3 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors flex-shrink-0">
                  {trackingSaved ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : "Save"}
                </button>
              </div>
              {trackingNumber && (
                <a href={`https://wa.me/${order.customer.phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Hi ${order.customer.name.split(" ")[0]}! 🚚 Your order (${order.orderNumber}) has been shipped!\n\nTracking number: *${trackingNumber}*\n\nEstimated delivery: 1–3 business days 💜`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1.5 text-xs text-[#25D366] font-semibold hover:underline">
                  <MessageCircle className="h-3 w-3 fill-[#25D366]" /> Send tracking to customer
                </a>
              )}
            </div>
          )}

          {/* Order note */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Internal note</p>
            <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} rows={2}
              placeholder="e.g. Customer requested gift wrapping…"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-purple/30 placeholder:text-muted-foreground" />
          </div>

          {updateSaved && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-brand-green/10 border border-brand-green/20">
              <CheckCheck className="h-3.5 w-3.5 text-brand-green" />
              <p className="text-xs font-semibold text-brand-green">Status updated to &quot;{localStatus}&quot;</p>
            </motion.div>
          )}
        </SheetBody>

        <SheetFooter className="flex-col gap-2">
          <Link href={`/dashboard/orders/${order?.id}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-1.5">
              <ChevronRight className="h-3.5 w-3.5" /> View full order details
            </Button>
          </Link>
          {nextStatus && currentStatus !== "cancelled" && (
            <Button className="w-full gap-1.5 h-9 text-xs" onClick={handleAdvanceStatus}>
              <StatusIcon className="h-3.5 w-3.5" /> Mark as {nextStatus}
            </Button>
          )}
          {nextStatus && currentStatus !== "cancelled" && (
            <a href={buildWhatsAppUpdate(order, nextStatus)} target="_blank" rel="noopener noreferrer" className="w-full">
              <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" /> Notify customer on WhatsApp
              </Button>
            </a>
          )}
          {currentStatus !== "cancelled" && (
            <button onClick={() => { setLocalStatus("cancelled"); onStatusChange(order.id, "cancelled") }}
              className="text-xs text-destructive/70 hover:text-destructive transition-colors font-medium">
              Cancel this order
            </button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Order Row ─────────────────────────────────────────────────────────────────
function OrderRow({ order, onClick, selected, onSelect }: {
  order: DashboardOrder; onClick: () => void
  selected: boolean; onSelect: (e: React.MouseEvent) => void
}) {
  const status = statusConfig[order.status]
  const SourceIcon = sourceIcon[order.source]
  return (
    <TableRow className={cn("cursor-pointer transition-colors", selected ? "bg-brand-purple/5 hover:bg-brand-purple/8" : "hover:bg-accent/50")}
      onClick={onClick}>
      <TableCell onClick={e => { e.stopPropagation(); onSelect(e) }}>
        {selected
          ? <CheckSquare className="h-4 w-4 text-brand-purple" />
          : <Square className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />}
      </TableCell>
      <TableCell>
        <p className="text-xs font-semibold font-mono">{order.orderNumber}</p>
        <p className="text-[10px] text-muted-foreground">{order.createdAt}</p>
      </TableCell>
      <TableCell>
        <p className="text-xs font-medium">{order.customer.name}</p>
        <p className="text-[10px] text-muted-foreground">{order.customer.phone}</p>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-border">
            <Image src={order.product.image} alt={order.product.name} fill className="object-cover" unoptimized />
          </div>
          <p className="text-xs truncate max-w-[130px]">{order.product.name}</p>
        </div>
      </TableCell>
      <TableCell><p className="text-sm font-bold">₦{order.amount.toLocaleString()}</p></TableCell>
      <TableCell>
        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", status.className)}>
          {status.label}
        </span>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className={cn("flex items-center gap-1.5", sourceColor[order.source])}>
          <SourceIcon className="h-3.5 w-3.5" />
          <span className="text-xs capitalize">{order.source}</span>
        </div>
      </TableCell>
      <TableCell onClick={e => e.stopPropagation()}>
        <Link href={`/dashboard/orders/${order.id}`}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </TableCell>
    </TableRow>
  )
}

function exportCSV(orders: DashboardOrder[]) {
  const headers = ["Order #", "Date", "Customer", "Phone", "Product", "Amount (₦)", "Status", "Source", "Delivery Address"]
  const rows = orders.map(o => [o.orderNumber, o.createdAt, o.customer.name, o.customer.phone, o.product.name, o.amount, o.status, o.source, `"${o.deliveryAddress}"`])
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `lummy-orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url)
}

type ApiOrder = {
  id: string; order_number: string; status: string; payment_status: string | null
  total_amount: number; currency: string; created_at: string; notes: string | null
  customer_name: string | null; customer_phone: string | null; customer_email: string | null
  source: string | null
}

function apiOrderToDashboard(o: ApiOrder): DashboardOrder {
  const validSources = ["whatsapp", "direct", "instagram", "tiktok"] as const
  const src = (validSources as readonly string[]).includes(o.source ?? "") ? o.source as DashboardOrder["source"] : "direct"
  return {
    id: o.id,
    orderNumber: o.order_number ?? `LMY-${o.id.slice(0, 6).toUpperCase()}`,
    customer: { name: o.customer_name ?? o.customer_email ?? "Unknown", phone: o.customer_phone ?? "" },
    product: { name: o.notes ?? "Order", image: "" },
    amount: o.total_amount,
    status: (o.status as OrderStatus) ?? "pending",
    source: src,
    createdAt: o.created_at,
    deliveryAddress: "",
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders, setOrders]           = React.useState<DashboardOrder[]>([])
  const [tab, setTab]                 = React.useState<typeof tabValues[number]>("all")
  const [search, setSearch]           = React.useState("")
  const [selectedOrder, setSelectedOrder] = React.useState<DashboardOrder | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [sortCol, setSortCol]         = React.useState<SortCol>("date")
  const [sortDir, setSortDir]         = React.useState<SortDir>("desc")
  const [dateFrom, setDateFrom]       = React.useState("")
  const [dateTo, setDateTo]           = React.useState("")
  const [showFilters, setShowFilters] = React.useState(false)
  const [showSourceChart, setShowSourceChart] = React.useState(false)
  const [ordersLoading, setOrdersLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/orders")
      .then(r => r.json())
      .then(({ data }) => {
        if (Array.isArray(data)) setOrders(data.map(apiOrderToDashboard))
      })
      .catch(() => null)
      .finally(() => setOrdersLoading(false))
  }, [])

  const handleStatusChange = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  const filtered = React.useMemo(() => {
    return orders
      .filter((o) => {
        const matchTab    = tab === "all" || o.status === tab
        const matchSearch = o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
          o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          o.product.name.toLowerCase().includes(search.toLowerCase())
        return matchTab && matchSearch
      })
      .sort((a, b) => {
        let diff = 0
        if (sortCol === "amount") diff = a.amount - b.amount
        if (sortCol === "status") diff = statusFlow.indexOf(a.status as OrderStatus) - statusFlow.indexOf(b.status as OrderStatus)
        // date: use createdAt string lexicographic (format is consistent enough)
        if (sortCol === "date")   diff = a.createdAt.localeCompare(b.createdAt)
        return sortDir === "desc" ? -diff : diff
      })
  }, [orders, tab, search, sortCol, sortDir])

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc")
    else { setSortCol(col); setSortDir("desc") }
  }

  const SortIcon = ({ col }: { col: SortCol }) =>
    sortCol === col
      ? sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
      : <ArrowUpDown className="h-3 w-3 opacity-30" />

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => {
      const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n
    })
  const selectAll   = () => setSelectedIds(new Set(filtered.map(o => o.id)))
  const clearSelect = () => setSelectedIds(new Set())

  const bulkAdvance = () => {
    let count = 0
    setOrders(prev => prev.map(o => {
      if (!selectedIds.has(o.id)) return o
      const idx = statusFlow.indexOf(o.status as OrderStatus)
      if (idx < 0 || idx >= statusFlow.length - 1) return o
      count++
      return { ...o, status: statusFlow[idx + 1] }
    }))
    toast({ title: `${count} orders advanced`, variant: "success" })
    clearSelect()
  }

  const bulkWhatsApp = () => {
    const targets = orders.filter(o => selectedIds.has(o.id))
    targets.slice(0, 5).forEach(o => {
      const firstName = o.customer.name.split(" ")[0]
      const url = `https://wa.me/${o.customer.phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Hi ${firstName}! 👋 Just a quick update on your order (${o.orderNumber}) — please let us know if you have any questions! 💜`)}`
      window.open(url, "_blank")
    })
    toast({ title: `Messaging ${Math.min(targets.length, 5)} customers` })
  }

  const countByStatus = (s: string) => s === "all" ? orders.length : orders.filter((o) => o.status === s).length
  const pendingCount   = orders.filter(o => o.status === "pending").length
  const deliveredCount = orders.filter(o => o.status === "delivered").length
  const todayRevenue   = orders.filter(o => o.status !== "cancelled").slice(0, 5).reduce((s, o) => s + o.amount, 0)
  const avgOrderValue  = Math.round(orders.reduce((s, o) => s + o.amount, 0) / (orders.length || 1))
  const fulfilmentRate = Math.round((deliveredCount / (orders.length || 1)) * 100)

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Orders</h1>
          <p className="text-sm text-muted-foreground">
            {pendingCount > 0
              ? <span className="text-amber-500 font-semibold">{pendingCount} pending</span>
              : <span className="text-brand-green font-semibold">All caught up!</span>}
            {" "}· {orders.length} total
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowSourceChart(v => !v)}
            className={cn("flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold transition-colors",
              showSourceChart ? "border-brand-purple/30 bg-brand-purple/5 text-brand-purple" : "border-border text-muted-foreground hover:bg-accent")}>
            <BarChart3 className="h-3.5 w-3.5" /> Sources
          </button>
          <Link href="/dashboard/orders/new">
            <Button size="sm" className="gap-1.5 h-9">
              <Plus className="h-4 w-4" /> New Order
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-2 h-9" onClick={() => exportCSV(filtered)}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Revenue (last 5)", value: `₦${Math.round(todayRevenue/1000)}k`, icon: TrendingUp, color: "text-brand-purple", sub: <RevSparkline /> },
          { label: "Pending orders",   value: pendingCount,                          icon: Clock,       color: pendingCount > 0 ? "text-amber-500" : "text-brand-green", sub: <p className="text-[10px] text-muted-foreground">{pendingCount > 0 ? "Needs attention" : "All clear"}</p> },
          { label: "Avg order value",  value: `₦${avgOrderValue.toLocaleString()}`,  icon: ShoppingBag, color: "text-brand-green",  sub: <p className="text-[10px] text-muted-foreground">Across all orders</p> },
          { label: "Fulfilment rate",  value: `${fulfilmentRate}%`,                  icon: CheckCheck,  color: "text-brand-green",  sub: <p className="text-[10px] text-muted-foreground">{deliveredCount} delivered</p> },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
            </div>
            <p className="font-display text-xl font-extrabold">{kpi.value}</p>
            <div className="mt-1">{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Source breakdown */}
      <AnimatePresence>
        {showSourceChart && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <SourceBreakdown orders={orders} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending alert */}
      {pendingCount >= 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 flex items-center gap-3">
          <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{pendingCount} orders waiting for confirmation</p>
            <p className="text-xs text-muted-foreground mt-0.5">Confirm orders quickly to start fulfilment and notify customers.</p>
          </div>
          <button onClick={() => setTab("pending")}
            className="text-xs font-semibold text-amber-600 hover:underline flex-shrink-0">
            View pending →
          </button>
        </motion.div>
      )}

      {/* Tabs + search + filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full sm:w-auto">
            <TabsList className="flex-wrap h-auto gap-0.5">
              {tabValues.map((v) => (
                <TabsTrigger key={v} value={v} className="capitalize text-xs gap-1.5">
                  {v}
                  <span className={cn("text-[9px] px-1 rounded-full",
                    v === "pending" && countByStatus(v) > 0 ? "bg-amber-500/20 text-amber-600 font-bold" : "bg-muted-foreground/10")}>
                    {countByStatus(v)}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex gap-2 sm:ml-auto flex-wrap">
            <Input placeholder="Search orders…" icon={<Search className="h-4 w-4" />}
              value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full sm:w-48" />
            <Button variant="outline" size="sm" className={cn("h-9 gap-1.5", showFilters && "border-brand-purple/30 text-brand-purple")}
              onClick={() => setShowFilters(v => !v)}>
              <Filter className="h-3.5 w-3.5" /> Filter
            </Button>
          </div>
        </div>

        {/* Date range filter */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl border border-border bg-muted/20">
                <span className="text-xs text-muted-foreground font-medium">Date range:</span>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-brand-purple/40" />
                <span className="text-xs text-muted-foreground">to</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-brand-purple/40" />
                {(dateFrom || dateTo) && (
                  <button onClick={() => { setDateFrom(""); setDateTo("") }}
                    className="h-8 px-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent transition-colors">
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-brand-purple/30 bg-brand-purple/5 px-4 py-2.5 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-brand-purple">{selectedIds.size} selected</span>
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 px-2.5" onClick={bulkAdvance}>
              <ChevronRight className="h-3 w-3" /> Advance status
            </Button>
            <button onClick={bulkWhatsApp}
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-[#25D366] text-white text-[10px] font-semibold hover:bg-[#22c55e] transition-colors">
              <MessageCircle className="h-3 w-3 fill-white" /> Message all
            </button>
            <button onClick={() => exportCSV(orders.filter(o => selectedIds.has(o.id)))}
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border text-[10px] font-semibold hover:bg-accent transition-colors">
              <Download className="h-3 w-3" /> Export selected
            </button>
            <button onClick={clearSelect} className="ml-auto p-1 rounded-lg hover:bg-muted transition-colors">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <button onClick={selectedIds.size === filtered.length && filtered.length > 0 ? clearSelect : selectAll}>
                  {selectedIds.size === filtered.length && filtered.length > 0
                    ? <CheckSquare className="h-4 w-4 text-brand-purple" />
                    : <Square className="h-4 w-4 text-muted-foreground" />}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("date")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Order # <SortIcon col="date" />
                </button>
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Product</TableHead>
              <TableHead>
                <button onClick={() => toggleSort("amount")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Amount <SortIcon col="amount" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("status")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Status <SortIcon col="status" />
                </button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Source</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordersLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                  Loading orders…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                  {orders.length === 0 ? "No orders yet — share your storefront to get started!" : "No orders match your filter"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => (
                <OrderRow key={order.id} order={order}
                  onClick={() => setSelectedOrder(order)}
                  selected={selectedIds.has(order.id)}
                  onSelect={(e) => { e.stopPropagation(); toggleSelect(order.id) }}
                />
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      <OrderDetailDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
