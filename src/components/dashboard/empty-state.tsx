"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
  ctaOnClick?: () => void
  secondaryLabel?: string
  secondaryHref?: string
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  ctaOnClick,
  secondaryLabel,
  secondaryHref,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/8">
        <span className="text-white/30">{icon}</span>
      </div>
      <h3 className="font-semibold text-white text-base mb-2">{title}</h3>
      <p className="text-sm text-white/40 max-w-xs leading-relaxed">{description}</p>

      {(ctaLabel || secondaryLabel) && (
        <div className="flex flex-col sm:flex-row items-center gap-2 mt-6">
          {ctaLabel && (
            ctaHref ? (
              <Button size="sm" asChild>
                <a href={ctaHref}>{ctaLabel}</a>
              </Button>
            ) : (
              <Button size="sm" onClick={ctaOnClick}>{ctaLabel}</Button>
            )
          )}
          {secondaryLabel && secondaryHref && (
            <Button size="sm" variant="ghost" asChild>
              <a href={secondaryHref}>{secondaryLabel}</a>
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}
