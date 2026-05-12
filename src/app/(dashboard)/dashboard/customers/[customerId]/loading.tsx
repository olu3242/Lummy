import { Skeleton } from "@/components/ui/skeleton"

export default function CustomerProfileLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-10" />
        <Skeleton className="h-3.5 w-3" />
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-3" />
        <Skeleton className="h-3.5 w-32" />
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders table */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-2.5 border-b border-border bg-muted/30 flex gap-4">
              {[160, 100, 80, 60].map((w, i) => <Skeleton key={i} className="h-3 rounded" style={{ width: w }} />)}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_120px_100px_80px] gap-4 px-5 py-4 border-b border-border last:border-0 items-center">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-3.5 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-xl" />
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-3.5 w-20" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
