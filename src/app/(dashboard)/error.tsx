"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("[dashboard/error]", {
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    })
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-sm w-full space-y-5"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-coral/10 border border-brand-coral/20 mx-auto">
          <AlertTriangle className="h-7 w-7 text-brand-coral" />
        </div>

        <div className="space-y-1.5">
          <h2 className="font-display text-xl font-extrabold">Page failed to load</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Something went wrong loading this section. Try refreshing or go back to the dashboard.
          </p>
          {error.digest && (
            <p className="text-[10px] text-muted-foreground/40 font-mono mt-2">ref: {error.digest}</p>
          )}
        </div>

        <div className="flex gap-2.5">
          <Button onClick={reset} className="flex-1 gap-2 h-9 text-sm">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full gap-2 h-9 text-sm">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
