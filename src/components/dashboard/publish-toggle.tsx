"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Globe, EyeOff, Loader2, ExternalLink, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface PublishToggleProps {
  initialPublished?: boolean
  handle?: string | null
  className?: string
}

export function PublishToggle({ initialPublished = false, handle, className }: PublishToggleProps) {
  const [isPublished, setIsPublished] = React.useState(initialPublished)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const toggle = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/store/publish", {
        method: isPublished ? "DELETE" : "POST",
      })
      const data = await res.json()

      if (!res.ok) {
        const msg = (data as { error?: string }).error ?? "Failed to update storefront"
        setError(msg)
        toast({ title: "Could not publish", description: msg, variant: "error" })
        return
      }

      setIsPublished(prev => !prev)
      toast({
        title: isPublished ? "Storefront unpublished" : "Storefront is live! 🚀",
        description: isPublished
          ? "Your store is now hidden from the public."
          : handle ? `lummy.co/${handle} is now live.` : "Your store is now public.",
        variant: "success",
      })
    } catch {
      toast({ title: "Network error", description: "Check your connection and try again.", variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-3">
        {/* Status badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
          isPublished
            ? "bg-brand-green/10 text-brand-green border-brand-green/20"
            : "bg-white/5 text-white/40 border-white/10"
        )}>
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            isPublished ? "bg-brand-green animate-pulse" : "bg-white/30"
          )} />
          {isPublished ? "Live" : "Draft"}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => void toggle()}
          disabled={loading}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
            loading && "opacity-60 cursor-not-allowed",
            isPublished
              ? "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              : "bg-brand-purple text-white border-transparent hover:bg-brand-purple/90"
          )}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isPublished ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Globe className="h-3.5 w-3.5" />
          )}
          {loading ? "Saving…" : isPublished ? "Unpublish" : "Publish Store"}
        </button>

        {/* View live link */}
        {isPublished && handle && (
          <a
            href={`/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View live
          </a>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 text-xs text-amber-400"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
