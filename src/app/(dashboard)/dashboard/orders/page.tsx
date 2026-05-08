"use client"

import * as React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Search, Download, MessageCircle, Instagram, Link2, Music, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { mockOrders, type OrderStatus, type DashboardOrder } from "@/data/mock/dashboard"
import { cn } from "@/lib/utils"

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending:    { label: "Pending",    className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  confirmed:  { label: "Confirmed",  className: "bg-brand-purple/10 text-brand-purple border-brand-purple/20" },
  processing: { label: "Processing", className: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20" },
  shipped:    { label: "Shipped",    className: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
  delivered:  { label: "Delivered",  className: "bg-brand-green/10 text-brand-green border-brand-green/20" },
  cancelled:  { label: "Cancelled",  className: "bg-destructive/10 text-destructive border-destructive/20" },
}

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

function OrderRow({ order }: { order: DashboardOrder }) {
  const status = statusConfig[order.status]
  const SourceIcon = sourceIcon[order.source]
  return (
    <TableRow>
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
        <div className="flex gap-1">
          {order.status === "pending" && (
            <Button size="sm" className="h-7 text-[10px] px-2">Confirm</Button>
          )}
          {order.source === "whatsapp" && (
            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 gap-1">
              <MessageCircle className="h-3 w-3 text-[#25D366]" />
              Reply
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function OrdersPage() {
  const [tab, setTab] = React.useState<typeof tabValues[number]>("all")
  const [search, setSearch] = React.useState("")

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
        <Button variant="outline" size="sm" className="gap-2 w-fit">
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
              <TableHead>Actions</TableHead>
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
              filtered.map((order) => <OrderRow key={order.id} order={order} />)
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  )
}
