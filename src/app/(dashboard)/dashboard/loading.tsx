import { Skeleton } from "@/components/ui/skeleton"
import { DashboardOverviewLoading } from "@/components/dashboard"
import { LummyLoader } from "@/components/ui/lummy-loader"

export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <LummyLoader
        mode="inline"
        text="Connecting your dashboard..."
        subtext="Loading workspace metrics and storefront activity."
        className="py-8"
        logoClassName="h-12 w-12"
      />
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>

      <Skeleton className="h-20 w-full rounded-2xl" />

      <DashboardOverviewLoading />
    </div>
  )
}
