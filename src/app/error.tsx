"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SmartLogo } from "@/components/shared/smart-logo"
import { createClient } from "@/lib/supabase/client"

function GoHomeButton() {
  const [href, setHref] = React.useState("/")
  React.useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setHref("/dashboard")
    })
  }, [])
  return (
    <Link href={href}>
      <Button variant="outline" className="w-full gap-2">
        <Home className="h-4 w-4" />
        Go home
      </Button>
    </Link>
  )
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("[app/error]", {
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    })
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-sm w-full space-y-6"
      >
        {/* Logo */}
        <SmartLogo
          imageClassName="h-9 w-9 rounded-xl"
          textClassName="font-display text-lg font-bold"
          className="inline-flex items-center gap-2 group"
          imageSize={36}
        />

        {/* Error icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-coral/10 border border-brand-coral/20 mx-auto">
          <AlertTriangle className="h-8 w-8 text-brand-coral" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-extrabold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred. Our team has been notified and is working on a fix.
          </p>
          {error.digest && (
            <p className="text-[10px] text-muted-foreground/50 font-mono">Error ID: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <Button onClick={reset} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <GoHomeButton />
        </div>
      </motion.div>
    </div>
  )
}
