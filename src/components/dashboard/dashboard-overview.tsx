import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { OrderSourcesChart } from "@/components/dashboard/order-sources-chart"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { TopProducts } from "@/components/dashboard/top-products"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { getAiConversionSummary, getCustomerMemorySummary, getDashboardOpsSummary, getDashboardPaymentSummary, getGrowthIntelligenceSummary } from "@/repositories/order-repository"

export async function DashboardOverview() {
  const summary = await getDashboardPaymentSummary()
  const aiSummary = await getAiConversionSummary()
  const customerMemory = await getCustomerMemorySummary()
  const ops = await getDashboardOpsSummary()
  const growth = await getGrowthIntelligenceSummary()
  const stats = [
    { id: "revenue", label: "Total Revenue", value: `₦${summary.totalRevenue.toLocaleString()}`, rawValue: summary.totalRevenue, change: summary.totalOrders > 0 ? `${summary.conversionRate}% paid` : "0% paid", trend: "up" as const, icon: "Wallet", color: "text-brand-green", bg: "bg-brand-green/10" },
    { id: "orders", label: "Total Orders", value: summary.totalOrders.toLocaleString(), rawValue: summary.totalOrders, change: `${summary.paidOrders} paid · ${summary.pendingPayments} pending`, trend: "up" as const, icon: "ShoppingBag", color: "text-brand-purple", bg: "bg-brand-purple/10" },
    { id: "failed", label: "Failed Payments", value: summary.failedPayments.toLocaleString(), rawValue: summary.failedPayments, change: summary.failedPayments > 0 ? "Needs review" : "Healthy", trend: summary.failedPayments > 0 ? "down" as const : "up" as const, icon: "TrendingUp", color: "text-amber-500", bg: "bg-amber-500/10" },
  ]

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => <StatsCard key={stat.id} stat={stat} index={i} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Active inquiries</p><p className="text-xl font-bold">{aiSummary.activeInquiries}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">AI checkouts generated</p><p className="text-xl font-bold">{aiSummary.checkoutGenerated}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Abandoned conversions</p><p className="text-xl font-bold">{aiSummary.abandoned}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Recovered conversions</p><p className="text-xl font-bold">{aiSummary.recovered}</p></div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Pending revenue</p><p className="text-xl font-bold">₦{summary.pendingRevenue.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Unpaid orders</p><p className="text-xl font-bold">{ops.unpaidOrders}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Stale inquiries</p><p className="text-xl font-bold">{ops.staleInquiries}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Webhook issues</p><p className="text-xl font-bold">{ops.webhookIssues}</p></div>
      </div>


      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Growth Opportunities</p>
        <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground space-y-1">
          {growth.growthInsights.map((insight) => <li key={insight}>{insight}</li>)}
          {growth.reorderOpportunities[0] ? <li>{growth.reorderOpportunities[0]}</li> : null}
          {growth.upsellOpportunities[0] ? <li>{growth.upsellOpportunities[0]}</li> : null}
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Top-performing offer</p><p className="text-sm font-bold">{growth.topProduct?.title ?? 'No paid sales yet'}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Top offer revenue</p><p className="text-xl font-bold">₦{Math.round(growth.topProduct?.revenue ?? 0).toLocaleString()}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Customer value segment</p><p className="text-sm font-bold">{growth.highValueSegment}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Repeat purchase offers</p><p className="text-xl font-bold">{growth.repeatPurchaseProducts.length}</p></div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">AI Revenue Insights</p>
        <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground space-y-1">
          {aiSummary.aiInsights.map((insight) => <li key={insight}>{insight}</li>)}
          <li>{customerMemory.opportunities[0] ?? 'No immediate repeat-revenue opportunity detected.'}</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Repeat customers</p><p className="text-xl font-bold">{customerMemory.repeatCustomers}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">High-value customers</p><p className="text-xl font-bold">{customerMemory.highValueCustomers}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Recent buyers</p><p className="text-xl font-bold">{customerMemory.recentBuyers}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Inactive customers</p><p className="text-xl font-bold">{customerMemory.inactiveCustomers}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Abandoned buyers</p><p className="text-xl font-bold">{customerMemory.abandonedBuyers}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><RevenueChart data={summary.recentRevenue} /></div>
        <OrderSourcesChart data={summary.sources} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><RecentOrders limit={5} /></div>
        <TopProducts />
      </div>

      <div className="grid grid-cols-1 gap-4" style={{ minHeight: 340 }}>
        <div className="h-[340px]"><ActivityFeed /></div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Need a deeper performance view?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Open Reports for full campaign, sales, and channel breakdowns.</p>
          </div>
          <Link href="/dashboard/reports" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-purple hover:underline">
            Open reports <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </>
  )
}
