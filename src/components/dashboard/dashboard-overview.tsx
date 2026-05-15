import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { OrderSourcesChart } from "@/components/dashboard/order-sources-chart"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { TopProducts } from "@/components/dashboard/top-products"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { FocusQueuePanel, HealthSignalsStrip, MilestonesPanel, QuickActionsPanel, TargetTrackerPanel } from "@/components/dashboard/overview-panels"
import { mockDashboardStats } from "@/data/mock/dashboard"

export function DashboardOverview() {
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4"><FocusQueuePanel /><TargetTrackerPanel /></div>
      <HealthSignalsStrip />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mockDashboardStats.map((stat, i) => <StatsCard key={stat.id} stat={stat} index={i} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><RevenueChart /></div>
        <OrderSourcesChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><RecentOrders limit={5} /></div>
        <TopProducts />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 340 }}>
        <div className="lg:col-span-2 h-[340px]"><ActivityFeed /></div>
        <QuickActionsPanel />
      </div>

      <MilestonesPanel />

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
