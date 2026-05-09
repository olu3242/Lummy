import { Skeleton } from "@/components/ui/skeleton"

export default function CRMLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3.5 w-3.5 rounded-full" />
            </div>
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-16 rounded-full" />
          ))}
        </div>
      </div>

      {/* Customer list */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_140px_100px_100px_120px_80px] gap-4 px-4 py-2.5 border-b border-border bg-muted/30">
          {["Customer","Location","Orders","Spent","Segment",""].map((h, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid sm:grid-cols-[1fr_140px_100px_100px_120px_80px] gap-4 px-4 py-4 border-b border-border last:border-0 items-center">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <Skeleton className="h-3 w-28 hidden sm:block" />
            <div className="hidden sm:block space-y-1.5">
              <Skeleton className="h-3.5 w-8" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-20 hidden sm:block" />
            <Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
            <div className="flex gap-1.5 justify-end">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
