import { Skeleton } from "@/components/ui/skeleton"

export default function BroadcastLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose panel */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-28" />
          {/* Segment selector */}
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
          </div>
          {/* Templates */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
          {/* Textarea */}
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        {/* Preview panel */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
      {/* History */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <Skeleton className="h-5 w-32" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
