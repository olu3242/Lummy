import { Skeleton } from "@/components/ui/skeleton"

export default function OrdersLoading() {
  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Tabs + search */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/30">
          {[80, 120, 160, 80, 90, 80, 60].map((w, i) => (
            <Skeleton key={i} className={`h-3 rounded`} style={{ width: w }} />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border last:border-0">
            <div className="space-y-1.5" style={{ width: 80 }}>
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
            <div className="space-y-1.5" style={{ width: 120 }}>
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex items-center gap-2" style={{ width: 160 }}>
              <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <Skeleton className="h-5 w-16" style={{ width: 80 }} />
            <Skeleton className="h-5 w-20 rounded-full" style={{ width: 90 }} />
            <div className="flex items-center gap-1.5" style={{ width: 80 }}>
              <Skeleton className="h-3.5 w-3.5 rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
            <Skeleton className="h-4 w-4 rounded" style={{ width: 60 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
