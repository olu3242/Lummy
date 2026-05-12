import { Skeleton } from "@/components/ui/skeleton"

export default function CalendarLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* Type filter */}
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-xl" />
        ))}
      </div>

      <div className="lg:flex lg:gap-6">
        {/* Calendar grid */}
        <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <Skeleton className="h-6 w-6 rounded-xl" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-6 rounded-xl" />
          </div>
          <div className="grid grid-cols-7 border-b border-border">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 mx-2 my-2 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[80px] border-r border-b border-border p-1.5 space-y-1">
                <Skeleton className="h-6 w-6 rounded-lg" />
                {i % 4 === 0 && <Skeleton className="h-4 w-full rounded-md" />}
                {i % 7 === 2 && <Skeleton className="h-4 w-full rounded-md" />}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-64 mt-5 lg:mt-0 space-y-3">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border">
              <Skeleton className="h-5 w-24" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0">
                <Skeleton className="h-7 w-7 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-3.5 w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
