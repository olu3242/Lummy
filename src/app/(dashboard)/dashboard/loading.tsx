import { Skeleton } from "@/components/ui/skeleton"
import { DashboardOverviewLoading } from "@/components/dashboard"

export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>

      <Skeleton className="h-20 w-full rounded-2xl" />

      <DashboardOverviewLoading />
    </div>
  )
}
