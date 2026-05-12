import { Skeleton } from "@/components/ui/skeleton"

export default function BundlesLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-7 w-40" />
          </div>
          <Skeleton className="h-4 w-72 ml-10" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        ))}
      </div>

      {/* Tip banner */}
      <Skeleton className="h-14 w-full rounded-2xl" />

      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-56 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Bundle cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full flex-shrink-0" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {Array.from({ length: 3 }).map((_, s) => (
                  <Skeleton key={s} className="h-8 w-8 rounded-lg border-2 border-card" />
                ))}
              </div>
              <Skeleton className="h-3 flex-1" />
            </div>
            <div className="flex gap-3 rounded-xl bg-muted/40 px-3 py-2">
              {Array.from({ length: 3 }).map((_, s) => (
                <div key={s} className="space-y-1">
                  <Skeleton className="h-2.5 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, s) => (
                <Skeleton key={s} className="h-12 rounded-xl" />
              ))}
            </div>
            <div className="flex gap-2">
              <Skeleton className="flex-1 h-9 rounded-xl" />
              <Skeleton className="h-9 w-20 rounded-xl" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
