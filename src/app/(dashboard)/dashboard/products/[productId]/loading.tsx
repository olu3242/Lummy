import { Skeleton } from "@/components/ui/skeleton"

export default function ProductDetailLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-10" />
        <Skeleton className="h-3.5 w-3" />
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-3" />
        <Skeleton className="h-3.5 w-36" />
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col sm:flex-row">
        <Skeleton className="w-full sm:w-48 h-48 flex-shrink-0 rounded-none" />
        <div className="flex-1 p-5 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3.5 w-32" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-28 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Tab + content */}
      <Skeleton className="h-9 w-48 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-14 w-full" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
