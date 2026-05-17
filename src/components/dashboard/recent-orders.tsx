import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { getDashboardPayments } from "@/repositories/order-repository"

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  succeeded: { label: "Paid", className: "bg-brand-green/10 text-brand-green border-brand-green/20" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

export async function RecentOrders({ limit = 6 }: { limit?: number }) {
  const payments = await getDashboardPayments(limit)

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="font-display font-bold">Recent Orders</h3>
          <p className="text-xs text-muted-foreground">Latest {limit} payment events for your organization</p>
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
            <TableHead>Customer</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-xs text-muted-foreground">No orders or payments yet.</TableCell></TableRow>
          ) : payments.map((payment) => {
            const status = statusConfig[payment.status] || statusConfig.pending
            return (
              <TableRow key={payment.id}>
                <TableCell>
                  <p className="text-xs font-semibold font-mono">{payment.order_id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(payment.created_at).toLocaleString()}</p>
                </TableCell>
                <TableCell className="text-xs">{payment.orders.customer_email}</TableCell>
                <TableCell className="text-xs capitalize">{payment.provider}</TableCell>
                <TableCell><p className="text-sm font-bold">{payment.currency} {Number(payment.amount).toLocaleString()}</p></TableCell>
                <TableCell><span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", status.className)}>{status.label}</span></TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
