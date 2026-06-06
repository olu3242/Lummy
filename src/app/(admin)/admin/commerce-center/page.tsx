import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { formatMoney } from "@/lib/globalization"
import {
  Store, Package, ShoppingCart, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle, Eye, BarChart3, Zap,
} from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Commerce Center" }

export default async function CommerceCenterPage() {
  await requireAdminAccess()
  const supabase = createClient()

  // ── Storefronts ────────────────────────────────────────────────────────
  let totalStorefronts = 0
  let publishedStorefronts = 0
  let emptyStorefronts = 0  // storefronts with no products
  let inactiveStorefronts = 0

  try {
    const { count } = await supabase
      .from("storefronts")
      .select("id", { count: "exact", head: true })
    totalStorefronts = count ?? 0

    const { count: pubCount } = await supabase
      .from("storefronts")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
    publishedStorefronts = pubCount ?? 0

    inactiveStorefronts = totalStorefronts - publishedStorefronts
  } catch (err) {
    console.error("[CommerceCenter] storefronts count failed:", err)
  }

  // ── Products ───────────────────────────────────────────────────────────
  let totalProducts = 0
  let activeProducts = 0
  let draftProducts = 0

  try {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
    totalProducts = count ?? 0

    const { count: activeCount } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
    activeProducts = activeCount ?? 0

    draftProducts = totalProducts - activeProducts
  } catch (err) {
    console.error("[CommerceCenter] products count failed:", err)
  }

  // ── Orders ─────────────────────────────────────────────────────────────
  let totalOrders = 0
  let completedOrders = 0
  let failedOrders = 0
  let pendingOrders = 0
  let totalGMV = 0
  let refundCount = 0

  try {
    const { data: orders, count } = await supabase
      .from("orders")
      .select("id, status, amount, currency, payment_status", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(500)

    totalOrders = count ?? 0

    if (orders) {
      for (const o of orders as Array<{
        id: string; status: string; amount: number; currency?: string; payment_status?: string
      }>) {
        const ps = o.payment_status ?? o.status
        if (ps === "paid" || o.status === "completed" || o.status === "delivered") {
          completedOrders++
          totalGMV += o.amount ?? 0
        } else if (ps === "failed" || o.status === "failed" || o.status === "cancelled") {
          failedOrders++
        } else if (ps === "pending" || o.status === "pending") {
          pendingOrders++
        } else if (ps === "refunded") {
          refundCount++
        }
      }
    }
  } catch (err) {
    console.error("[CommerceCenter] orders query failed:", err)
  }

  // ── Top storefronts by order count ────────────────────────────────────
  let topStorefronts: Array<{ handle: string; orderCount: number; revenue: number }> = []
  try {
    const { data: sfOrders } = await supabase
      .from("orders")
      .select(`
        amount, payment_status, status,
        storefronts:storefront_id ( handle )
      `)
      .limit(500)

    if (sfOrders) {
      const sfMap: Record<string, { orderCount: number; revenue: number }> = {}
      for (const o of sfOrders as unknown as Array<{
        amount: number; payment_status?: string; status: string
        storefronts: { handle?: string } | null
      }>) {
        const handle = o.storefronts?.handle ?? "unknown"
        if (!sfMap[handle]) sfMap[handle] = { orderCount: 0, revenue: 0 }
        sfMap[handle].orderCount++
        if (o.payment_status === "paid" || o.status === "completed") {
          sfMap[handle].revenue += o.amount ?? 0
        }
      }
      topStorefronts = Object.entries(sfMap)
        .map(([handle, v]) => ({ handle, ...v }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
    }
  } catch (err) {
    console.error("[CommerceCenter] top storefronts query failed:", err)
  }

  const conversionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
  const publishRate = totalStorefronts > 0 ? Math.round((publishedStorefronts / totalStorefronts) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-[#6C4EF3]" />
          Commerce Center
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Creator monetization health — storefronts, products, orders, GMV, payments.
        </p>
      </div>

      {/* GMV + conversion row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/50">Total GMV (paid orders)</p>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">{formatMoney(totalGMV)}</p>
          <p className="text-xs text-white/30 mt-1">Across {completedOrders} completed orders</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/50 mb-2">Order Conversion Rate</p>
          <p className="text-3xl font-bold text-white">{conversionRate}%</p>
          <div className="mt-3 h-1.5 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${conversionRate}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/50 mb-2">Storefront Publish Rate</p>
          <p className="text-3xl font-bold text-white">{publishRate}%</p>
          <div className="mt-3 h-1.5 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#6C4EF3]" style={{ width: `${publishRate}%` }} />
          </div>
        </div>
      </div>

      {/* Storefronts + Products KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Storefronts", value: totalStorefronts, icon: Store, color: "text-white" },
          { label: "Published", value: publishedStorefronts, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Total Products", value: totalProducts, icon: Package, color: "text-white" },
          { label: "Active Products", value: activeProducts, icon: Zap, color: "text-[#6C4EF3]" },
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

      {/* Order status KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: totalOrders, icon: ShoppingCart, color: "text-white" },
          { label: "Completed", value: completedOrders, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Failed / Cancelled", value: failedOrders, icon: XCircle, color: failedOrders > 0 ? "text-red-400" : "text-white/30" },
          { label: "Refunded", value: refundCount, icon: AlertTriangle, color: refundCount > 0 ? "text-amber-400" : "text-white/30" },
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

      {/* Top storefronts */}
      {topStorefronts.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#6C4EF3]" /> Top Storefronts by Revenue
          </h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">#</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Handle</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Orders</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topStorefronts.map((sf, i) => (
                  <tr key={sf.handle} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-4 text-white/30 text-xs">{i + 1}</td>
                    <td className="py-2.5 px-4 font-mono text-[#6C4EF3] text-sm">/{sf.handle}</td>
                    <td className="py-2.5 px-4 text-white/70">{sf.orderCount}</td>
                    <td className="py-2.5 px-4 text-white font-semibold">{formatMoney(sf.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Known partial-data issues */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Known Commerce Gaps
        </h2>
        <div className="space-y-2">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs text-emerald-400">
              <strong>Create product flow:</strong> Operational — <span className="font-mono">/api/products</span> →{" "}
              <span className="font-mono">createProductForCurrentUser()</span> → persisted to DB with correct org isolation.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs text-emerald-400">
              <strong>Checkout → Order creation:</strong> Operational — creates real orders and payments rows,
              updates on webhook. Idempotency key pattern in place.
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-400">
              <strong>Product analytics (sales/views/stock):</strong> Fields hardcoded as 0 in storefront renderer
              and dashboard products view. Real tracking not yet wired.
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-400">
              <strong>Checkout guest email:</strong> Falls back to{" "}
              <span className="font-mono">guest@lummy.local</span> when authenticated user email unavailable.
              This affects CRM lead capture for guest checkout.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/50">
              <strong>Storefront view counts:</strong> Public storefront shows static mock values for views, social proof.
              No live tracking integration yet.
            </p>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 text-xs text-white/20">
        <Eye className="w-3 h-3" />
        <span>Sources: <span className="font-mono">storefronts</span>, <span className="font-mono">products</span>, <span className="font-mono">orders</span></span>
      </div>
    </div>
  )
}
