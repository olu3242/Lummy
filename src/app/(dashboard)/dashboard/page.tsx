import { Sparkles, ArrowRight, Share2, Plus, ExternalLink } from "lucide-react"
import Link from "next/link"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { OrderSourcesChart } from "@/components/dashboard/order-sources-chart"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { TopProducts } from "@/components/dashboard/top-products"
import { Button } from "@/components/ui/button"
import { mockDashboardStats, mockCreatorProfile } from "@/data/mock/dashboard"

const quickActions = [
  { label: "Add Product", icon: Plus, href: "/dashboard/products", color: "bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20" },
  { label: "Share Store", icon: Share2, href: "#", color: "bg-brand-green/10 text-brand-green hover:bg-brand-green/20" },
  { label: "AI Caption", icon: Sparkles, href: "/dashboard/ai", color: "bg-brand-coral/10 text-brand-coral hover:bg-brand-coral/20" },
  { label: "View Store", icon: ExternalLink, href: "#", color: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" },
]

export default function DashboardPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            Good morning, {mockCreatorProfile.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here&apos;s what&apos;s happening with your store.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          {quickActions.map(({ label, icon: Icon, href, color }) => (
            <Link
              key={label}
              href={href}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${color}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* AI banner */}
      <div className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-purple/10 border border-brand-purple/20">
          <Sparkles className="h-5 w-5 text-brand-purple" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Your AI weekly brief is ready</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            3 campaign ideas, 5 caption drafts, and 2 pricing recommendations based on last week&apos;s data.
          </p>
        </div>
        <Button size="sm" variant="default" asChild>
          <Link href="/dashboard/ai" className="flex items-center gap-1.5">
            View Brief <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mockDashboardStats.map((stat, i) => (
          <StatsCard key={stat.id} stat={stat} index={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <OrderSourcesChart />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentOrders limit={5} />
        </div>
        <TopProducts />
      </div>
    </div>
  )
}
