import Image from "next/image"
import Link from "next/link"
import { ExternalLink, MessageCircle, Instagram, Link2, Music } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { mockOrders, type OrderStatus } from "@/data/mock/dashboard"
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

export function RecentOrders({ limit = 6 }: { limit?: number }) {
  const orders = mockOrders.slice(0, limit)

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="font-display font-bold">Recent Orders</h3>
          <p className="text-xs text-muted-foreground">Latest {limit} orders from all channels</p>
        </div>
        <Link href="/dashboard/orders" className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline">
          View all
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Order</TableHead>
            <TableHead className="hidden sm:table-cell">Customer</TableHead>
            <TableHead className="hidden md:table-cell">Product</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const status = statusConfig[order.status]
            const SourceIcon = sourceIcon[order.source]
            return (
              <TableRow key={order.id}>
                <TableCell>
                  <p className="text-xs font-semibold font-mono">{order.orderNumber}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{order.createdAt}</p>
                </TableCell>

                <TableCell className="hidden sm:table-cell">
                  <p className="text-xs font-medium">{order.customer.name}</p>
                  <p className="text-[10px] text-muted-foreground">{order.customer.phone}</p>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="relative w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                      <Image src={order.product.image} alt={order.product.name} fill className="object-cover" unoptimized />
                    </div>
                    <p className="text-xs truncate max-w-[140px]">{order.product.name}</p>
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
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
