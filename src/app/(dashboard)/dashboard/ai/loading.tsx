import { Skeleton } from "@/components/ui/skeleton"

export default function AILoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="space-y-2 mb-6">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>
      {/* Chat messages */}
      <div className="flex-1 space-y-4 overflow-hidden">
        {/* AI message */}
        <div className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-xl flex-shrink-0" />
          <div className="space-y-2 max-w-[70%]">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-16 w-72 rounded-2xl" />
          </div>
        </div>
        {/* User message */}
        <div className="flex gap-3 justify-end">
          <div className="space-y-2 max-w-[60%]">
            <Skeleton className="h-12 w-52 rounded-2xl ml-auto" />
          </div>
          <Skeleton className="h-8 w-8 rounded-xl flex-shrink-0" />
        </div>
        {/* AI response */}
        <div className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-xl flex-shrink-0" />
          <div className="space-y-2 max-w-[75%]">
            <Skeleton className="h-24 w-80 rounded-2xl" />
          </div>
        </div>
      </div>
      {/* Input */}
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-12 flex-1 rounded-2xl" />
        <Skeleton className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  )
}
