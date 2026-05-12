import { Skeleton } from "@/components/ui/skeleton"

export default function LinksLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Quick add */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-3.5 w-28" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Links list */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0">
                <Skeleton className="h-8 w-8 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-[180px] rounded-[32px]" style={{ height: 360 }} />
          <div className="w-full rounded-2xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-full rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1 rounded-xl" />
              <Skeleton className="h-8 flex-1 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
