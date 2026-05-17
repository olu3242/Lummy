import { Skeleton } from "@/components/ui/skeleton"

export function FocusQueueSkeleton() {
  return (
    <div className="xl:col-span-2 rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-background/50 p-3.5 flex items-start gap-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      ))}
    </div>
  )
}

export function TargetTrackerSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

export function HealthSignalsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </div>
  )
}
