"use client"

import * as React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Search,
  Download,
  MessageCircle,
  Instagram,
  Link2,
  Music,
  Filter,
  MapPin,
  Package,
  CheckCheck,
  Clock,
  Truck,
  XCircle,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet"
import { mockOrders, type OrderStatus, type DashboardOrder } from "@/data/mock/dashboard"
import { cn } from "@/lib/utils"

const statusConfig: Record<OrderStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending:    { label: "Pending",    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",        icon: Clock },
  confirmed:  { label: "Confirmed",  className: "bg-brand-purple/10 text-brand-purple border-brand-purple/20", icon: CheckCheck },
  processing: { label: "Processing", className: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20", icon: Package },
  shipped:    { label: "Shipped",    className: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",            icon: Truck },
  delivered:  { label: "Delivered",  className: "bg-brand-green/10 text-brand-green border-brand-green/20",  icon: CheckCheck },
  cancelled:  { label: "Cancelled",  className: "bg-destructive/10 text-destructive border-destructive/20",  icon: XCircle },
}

const statusFlow: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"]

const sourceIcon: Record<string, React.ElementType> = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  direct: Link2,
  tiktok: Music,
}
const sourceColor: Record<string, string> = {
  whatsapp: "text-[#25D366]",
  instagram: "text-pink-400",
  direct: "text-brand-purple",
  tiktok: "text-red-400",
}

const tabValues = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"] as const

function buildWhatsAppUpdate(order: DashboardOrder, newStatus: OrderStatus): string {
  const firstName = order.customer.name.split(" ")[0]
  const msgs: Partial<Record<OrderStatus, string>> = {
    confirmed: `Hi ${firstName}! ✅ Your order (${order.orderNumber}) for *${order.product.name}* has been confirmed. We'll start processing it right away!`,
    processing: `Hi ${firstName}! 📦 We're now preparing your order (${order.orderNumber}). We'll notify you once it's shipped!`,
    shipped: `Hi ${firstName}! 🚚 Great news! Your order (${order.orderNumber}) is on its way via GIG Logistics. Estimated delivery: 1–3 business days.`,
    delivered: `Hi ${firstName}! 🎉 Your order (${order.orderNumber}) has been delivered! We hope you love it. Please leave us a review — it helps so much! 💜`,
  }
  const text = msgs[newStatus] ?? `Hi ${firstName}! Your order (${order.orderNumber}) status has been updated to: ${newStatus}.`
  const cleanPhone = order.customer.phone.replace(/\D/g, "")
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
}

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
        const done = i <= currentIdx
        const isCurrent = i === currentIdx
        const cfg = statusConfig[s]
        const Icon = cfg.icon
        return (
          <div key={s} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 flex-shrink-0 transition-colors",
                done ? "border-brand-purple bg-brand-purple" : "border-border bg-background"
              )}>
                <Icon className={cn("h-3 w-3", done ? "text-white" : "text-muted-foreground")} />
              </div>
              {i < statusFlow.length - 1 && (
                <div className={cn("w-0.5 h-6 my-0.5 transition-colors", done && i < currentIdx ? "bg-brand-purple" : "bg-border")} />
              )}
            </div>
            <div className="pb-4 pt-1 min-w-0">
              <p className={cn("text-xs font-semibold capitalize", isCurrent ? "text-brand-purple" : done ? "text-foreground" : "text-muted-foreground")}>
                {s}
              </p>
              {isCurrent && <p className="text-[10px] text-muted-foreground mt-0.5">Current status</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OrderDetailDrawer({
  order,
  onClose,
}: {
  order: DashboardOrder | null
  onClose: () => void
}) {
  const [localStatus, setLocalStatus] = React.useState<OrderStatus | null>(null)
  const [updateSaved, setUpdateSaved] = React.useState(false)
  const [trackingNumber, setTrackingNumber] = React.useState("")
  const [trackingSaved, setTrackingSaved] = React.useState(false)

  React.useEffect(() => {
    if (order) { setLocalStatus(order.status); setUpdateSaved(false); setTrackingNumber(""); setTrackingSaved(false) }
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
              <a
                href={`https://wa.me/${order.customer.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors flex-shrink-0"
              >
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

          {/* Delivery address */}
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

          {/* Tracking number (shown when shipped or delivered) */}
          {(currentStatus === "shipped" || currentStatus === "delivered") && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tracking number</p>
              <div className="flex gap-2">
                <input
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="e.g. GIG-8812993"
                  className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                />
                <button
                  onClick={() => { if (trackingNumber.trim()) { setTrackingSaved(true); setTimeout(() => setTrackingSaved(false), 2500) } }}
                  className="h-9 px-3 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors flex-shrink-0"
                >
                  {trackingSaved ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : "Save"}
                </button>
              </div>
              {trackingNumber && (
                <a
                  href={`https://wa.me/${order?.customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${order?.customer.name.split(" ")[0]}! 🚚 Your order (${order?.orderNumber}) has been shipped!\n\nTracking number: *${trackingNumber}*\n\nYou can track your package via GIG Logistics or contact us for updates. Estimated delivery: 1–3 business days 💜`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1.5 text-xs text-[#25D366] font-semibold hover:underline"
                >
                  <MessageCircle className="h-3 w-3 fill-[#25D366]" />
                  Send tracking to customer via WhatsApp
                </a>
              )}
            </div>
          )}

          {/* Status update saved flash */}
          {updateSaved && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-brand-green/10 border border-brand-green/20"
            >
              <CheckCheck className="h-3.5 w-3.5 text-brand-green" />
              <p className="text-xs font-semibold text-brand-green">Status updated to "{localStatus}"</p>
            </motion.div>
          )}
        </SheetBody>

        <SheetFooter className="flex-col gap-2">
          {/* Advance status */}
          {nextStatus && currentStatus !== "cancelled" && (
            <Button
              className="w-full gap-1.5 h-9 text-xs"
              onClick={handleAdvanceStatus}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              Mark as {nextStatus}
            </Button>
          )}

          {/* WhatsApp update message */}
          {nextStatus && currentStatus !== "cancelled" && (
            <a
              href={buildWhatsAppUpdate(order, nextStatus)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                Notify customer on WhatsApp
              </Button>
            </a>
          )}

          {currentStatus !== "cancelled" && (
            <button
              onClick={() => setLocalStatus("cancelled")}
              className="text-xs text-destructive/70 hover:text-destructive transition-colors font-medium"
            >
              Cancel this order
            </button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function OrderRow({ order, onClick }: { order: DashboardOrder; onClick: () => void }) {
  const status = statusConfig[order.status]
  const SourceIcon = sourceIcon[order.source]
  return (
    <TableRow className="cursor-pointer hover:bg-accent/50" onClick={onClick}>
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
      <TableCell>
        <p className="text-sm font-bold">₦{order.amount.toLocaleString()}</p>
      </TableCell>
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
      <TableCell>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </TableCell>
    </TableRow>
  )
}

function exportCSV(orders: DashboardOrder[]) {
  const headers = ["Order #", "Date", "Customer", "Phone", "Product", "Amount (₦)", "Status", "Source", "Delivery Address"]
  const rows = orders.map(o => [
    o.orderNumber, o.createdAt, o.customer.name, o.customer.phone,
    o.product.name, o.amount, o.status, o.source, `"${o.deliveryAddress}"`,
  ])
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `lummy-orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function OrdersPage() {
  const [tab, setTab] = React.useState<typeof tabValues[number]>("all")
  const [search, setSearch] = React.useState("")
  const [selectedOrder, setSelectedOrder] = React.useState<DashboardOrder | null>(null)

  const filtered = mockOrders.filter((o) => {
    const matchTab = tab === "all" || o.status === tab
    const matchSearch =
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const countByStatus = (s: string) => (s === "all" ? mockOrders.length : mockOrders.filter((o) => o.status === s).length)

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Orders</h1>
          <p className="text-sm text-muted-foreground">
            {mockOrders.filter((o) => o.status === "pending").length} pending · {mockOrders.length} total
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 w-fit" onClick={() => exportCSV(mockOrders)}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full sm:w-auto">
          <TabsList className="flex-wrap h-auto gap-0.5">
            {tabValues.map((v) => (
              <TabsTrigger key={v} value={v} className="capitalize text-xs gap-1.5">
                {v}
                <span className="text-[9px] px-1 rounded-full bg-muted-foreground/10">
                  {countByStatus(v)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex gap-2 sm:ml-auto">
          <Input
            placeholder="Search orders…"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full sm:w-48"
          />
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Source</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  No orders match your filter
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => (
                <OrderRow key={order.id} order={order} onClick={() => setSelectedOrder(order)} />
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      <OrderDetailDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  )
}
