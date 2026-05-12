import { Skeleton } from "@/components/ui/skeleton"

export default function NewOrderLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 space-y-5 lg:space-y-0">
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-28 rounded-xl" />
            </div>
            <div className="py-10 flex flex-col items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <Skeleton className="h-5 w-36" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-5 w-36" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="p-5 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="border-t border-border pt-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
            <div className="px-5 pb-5 space-y-2.5">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
