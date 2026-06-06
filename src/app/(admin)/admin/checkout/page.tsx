import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { ShoppingCart, CheckCircle2, XCircle, AlertTriangle, Clock, TrendingUp } from "lucide-react"
import { formatMoney } from "@/lib/globalization"

export const dynamic = "force-dynamic"
export const metadata = { title: "Checkout Operations" }

type Order = {
  id: string
  status: string
  amount: number
  currency: string
  productName: string
  storefrontHandle: string
  createdAt: string
  paymentStatus: string
}

const STATUS_COLOR: Record<string, string> = {
  paid: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  failed: "text-red-400 bg-red-400/10 border-red-400/20",
  cancelled: "text-white/30 bg-white/5 border-white/10",
  refunded: "text-blue-400 bg-blue-400/10 border-blue-400/20",
}

export default async function CheckoutPage() {
  await requireAdminAccess()
  const supabase = createClient()

  let orders: Order[] = []
  let totalCount = 0

  try {
    const { data, count, error } = await supabase
      .from("orders")
      .select(`
        id, status, amount, currency, created_at,
        payment_status,
        products:product_id ( title ),
        storefronts:storefront_id ( handle )
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(200)

    if (!error && data) {
      totalCount = count ?? 0
      orders = (data as unknown as Array<{
        id: string; status: string; amount: number; currency?: string
        created_at: string; payment_status?: string
        products: { title?: string } | null
        storefronts: { handle?: string } | null
      }>).map(o => ({
        id: o.id,
        status: o.status ?? "pending",
        amount: o.amount ?? 0,
        currency: o.currency ?? "USD",
        productName: o.products?.title ?? "Unknown product",
        storefrontHandle: o.storefronts?.handle ?? "—",
        createdAt: o.created_at,
        paymentStatus: o.payment_status ?? o.status,
      }))
    }
  } catch (err) {
    console.error("[AdminCheckout] Failed to fetch orders:", err)
  }

  // If products join didn't work, fall back to simpler query
  if (orders.length === 0) {
    try {
      const { data, count, error } = await supabase
        .from("orders")
        .select("id, status, amount, currency, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(200)

      if (!error && data) {
        totalCount = count ?? 0
        orders = data.map((o: { id: string; status: string; amount: number; currency?: string; created_at: string }) => ({
          id: o.id,
          status: o.status ?? "pending",
          amount: o.amount ?? 0,
          currency: o.currency ?? "USD",
          productName: "—",
          storefrontHandle: "—",
          createdAt: o.created_at,
          paymentStatus: o.status,
        }))
      }
    } catch (err) {
      console.error("[AdminCheckout] Fallback query failed:", err)
    }
  }

  const successfulCheckouts = orders.filter(o => o.paymentStatus === "paid" || o.status === "completed" || o.status === "delivered").length
  const failedCheckouts = orders.filter(o => o.paymentStatus === "failed" || o.status === "failed" || o.status === "cancelled").length
  const pendingCheckouts = orders.filter(o => o.status === "pending" || o.paymentStatus === "pending").length
  const abandonedCheckouts = orders.filter(o => o.status === "abandoned").length
  const totalRevenue = orders.filter(o => o.paymentStatus === "paid" || o.status === "completed" || o.status === "delivered").reduce((acc, o) => acc + (o.amount ?? 0), 0)

  const successRate = totalCount > 0 ? Math.round((successfulCheckouts / totalCount) * 100) : 0

  // Currency breakdown
  const currencyBreakdown = orders.reduce<Record<string, { count: number; amount: number }>>((acc, o) => {
    const cur = o.currency ?? "USD"
    if (!acc[cur]) acc[cur] = { count: 0, amount: 0 }
    acc[cur].count++
    if (o.paymentStatus === "paid" || o.status === "completed") acc[cur].amount += o.amount
    return acc
  }, {})

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-[#6C4EF3]" />
          Checkout Operations
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Platform-wide checkout funnel — attempts, successes, failures, and abandonment across all creators and storefronts.
        </p>
      </div>

      {failedCheckouts > 5 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">
            <strong>{failedCheckouts} failed checkout{failedCheckouts > 1 ? "s" : ""}</strong> detected. Check payment provider logs for root cause.
          </p>
        </div>
      )}

      {/* Funnel KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total checkout attempts", value: totalCount, icon: ShoppingCart, color: "text-white" },
          { label: "Successful", value: successfulCheckouts, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Failed", value: failedCheckouts, icon: XCircle, color: failedCheckouts > 0 ? "text-red-400" : "text-white" },
          { label: "Abandoned", value: abandonedCheckouts, icon: Clock, color: "text-amber-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/50">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue + rate */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/50">Total revenue (paid orders)</p>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">{formatMoney(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/50 mb-2">Checkout success rate</p>
          <p className="text-3xl font-bold text-white">{successRate}%</p>
          <div className="mt-3 h-1.5 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#6C4EF3]" style={{ width: `${successRate}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/50 mb-2">Pending payments</p>
          <p className="text-3xl font-bold text-amber-400">{pendingCheckouts}</p>
          {pendingCheckouts > 0 && <p className="text-xs text-white/30 mt-1">Awaiting payment confirmation</p>}
        </div>
      </div>

      {/* Currency breakdown */}
      {Object.keys(currencyBreakdown).length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-white mb-3">By Currency</h2>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(currencyBreakdown).map(([currency, { count, amount }]) => (
              <div key={currency} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-mono text-[#6C4EF3] font-bold">{currency}</p>
                <p className="text-xl font-bold text-white mt-1">{formatMoney(amount, currency)}</p>
                <p className="text-xs text-white/40 mt-0.5">{count} order{count !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Order table */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">Recent Orders</h2>
        {orders.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-sm text-white/30">No orders found in database.</p>
            <p className="text-xs text-white/20 mt-1 font-mono">orders table returned 0 rows</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Order ID</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Product</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Storefront</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 50).map(order => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-white/40 text-[10px]">{order.id.slice(0, 8)}…</td>
                    <td className="py-2.5 px-4 text-white/70">{order.productName}</td>
                    <td className="py-2.5 px-4 font-mono text-[#6C4EF3]">
                      {order.storefrontHandle !== "—" ? `/${order.storefrontHandle}` : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-white/70">{formatMoney(order.amount, order.currency)}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border ${STATUS_COLOR[order.paymentStatus] ?? STATUS_COLOR[order.status] ?? "text-white/50 bg-white/5 border-white/10"}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-white/40">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalCount > 50 && (
              <div className="px-4 py-3 border-t border-white/10 text-xs text-white/30">
                Showing 50 of {totalCount} orders
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
