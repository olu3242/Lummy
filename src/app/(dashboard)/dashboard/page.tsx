import { Sparkles, ArrowRight, Plus, ExternalLink } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { OrderSourcesChart } from "@/components/dashboard/order-sources-chart"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { TopProducts } from "@/components/dashboard/top-products"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist"
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting"
import { ShareStorePanel } from "@/components/dashboard/share-store-panel"
import { Button } from "@/components/ui/button"
import { mockDashboardStats, mockCreatorProfile } from "@/data/mock/dashboard"

const HANDLE = "sade.styles"

export default function DashboardPage() {
  const firstName = mockCreatorProfile.name.split(" ")[0]

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <DashboardGreeting firstName={firstName} />
          <p className="text-sm text-muted-foreground mt-0.5">
            Here&apos;s what&apos;s happening with your store.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          <Link href="/dashboard/products"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20">
            <Plus className="h-3.5 w-3.5" /> Add Product
          </Link>

          <ShareStorePanel />

          <Link href="/dashboard/ai"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors bg-brand-coral/10 text-brand-coral hover:bg-brand-coral/20">
            <Sparkles className="h-3.5 w-3.5" /> AI Caption
          </Link>

          <Link href={`/${HANDLE}`} target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
            <ExternalLink className="h-3.5 w-3.5" /> View Store
          </Link>
        </div>
      </div>

      {/* Onboarding checklist */}
      <OnboardingChecklist />

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

      {/* Live activity + mini top-products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 340 }}>
        <div className="lg:col-span-2 h-[340px]">
          <ActivityFeed />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <p className="text-sm font-bold">Quick Actions</p>
          {[
            { label: "Create new order", href: "/dashboard/orders/new",  color: "bg-brand-purple/10 text-brand-purple" },
            { label: "Add product",      href: "/dashboard/products/new", color: "bg-brand-green/10 text-brand-green"  },
            { label: "Send broadcast",   href: "/dashboard/broadcast",    color: "bg-[#25D366]/10 text-[#25D366]"     },
            { label: "View reports",     href: "/dashboard/reports",      color: "bg-amber-500/10 text-amber-500"     },
            { label: "Add discount",     href: "/dashboard/discounts",    color: "bg-brand-coral/10 text-brand-coral" },
            { label: "Check inventory",  href: "/dashboard/inventory",    color: "bg-brand-indigo/10 text-brand-indigo"},
          ].map((item) => (
            <Link key={item.label} href={item.href}
              className={cn("flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80", item.color)}>
              {item.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
