import { Skeleton } from "@/components/ui/skeleton"

export default function TemplatesLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        ))}
      </div>

      {/* Search + tabs */}
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-xl" />
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="flex gap-1.5">
              <Skeleton className="h-8 flex-1 rounded-xl" />
              <Skeleton className="h-8 flex-1 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
