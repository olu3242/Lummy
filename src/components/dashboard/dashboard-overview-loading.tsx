import { Skeleton } from "@/components/ui/skeleton"
import { FocusQueueSkeleton, HealthSignalsSkeleton, TargetTrackerSkeleton } from "@/components/dashboard/overview-loading-panels"

export function DashboardOverviewLoading() {
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <FocusQueueSkeleton />
        <TargetTrackerSkeleton />
      </div>

      <HealthSignalsSkeleton />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-4 rounded-full" /></div>
            <Skeleton className="h-7 w-28" /><Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between"><Skeleton className="h-5 w-32" /><div className="flex gap-1">{[0, 1, 2].map(i => <Skeleton key={i} className="h-7 w-10 rounded-lg" />)}</div></div>
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-40 w-40 rounded-full mx-auto" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Skeleton className="h-2.5 w-2.5 rounded-full" /><Skeleton className="h-3 w-20" /></div>
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border"><Skeleton className="h-5 w-28" /></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0">
              <Skeleton className="h-8 w-8 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-40" /><Skeleton className="h-3 w-24" /></div>
              <Skeleton className="h-4 w-16 rounded-full" /><Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border"><Skeleton className="h-5 w-28" /></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0">
              <Skeleton className="h-6 w-6 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-2 w-full rounded-full" /></div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2"><Skeleton className="h-4 w-52" /><Skeleton className="h-3 w-72" /></div>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </>
  )
}
