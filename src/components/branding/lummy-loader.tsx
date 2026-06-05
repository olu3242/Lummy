"use client"

import * as React from "react"
import Image from "next/image"
import { BRAND } from "@/config/branding"
import { cn } from "@/lib/utils"

export type LoaderContext =
  | "auth"
  | "onboarding"
  | "dashboard"
  | "products"
  | "orders"
  | "storefront"
  | "payments"
  | "default"

const CONTEXT_LABELS: Record<LoaderContext, string> = {
  auth:        "Signing you in…",
  onboarding:  "Setting up your business…",
  dashboard:   "Loading your workspace…",
  products:    "Loading your catalog…",
  orders:      "Loading your orders…",
  storefront:  "Preparing your storefront…",
  payments:    "Preparing checkout…",
  default:     "Loading…",
}

interface LummyLoaderProps {
  context?: LoaderContext
  /** Custom override label */
  label?: string
  size?: "sm" | "md" | "lg"
  /** Show the text label below the logo */
  showLabel?: boolean
  className?: string
}

const SIZE_MAP = {
  sm: { logo: 32, ring: "h-12 w-12" },
  md: { logo: 48, ring: "h-16 w-16" },
  lg: { logo: 64, ring: "h-20 w-20" },
}

/**
 * Official Lummy brand loader.
 * Replaces all generic spinners/skeletons at route-level loading boundaries.
 */
export function LummyLoader({
  context = "default",
  label,
  size = "md",
  showLabel = true,
  className,
}: LummyLoaderProps) {
  const { logo: logoSize, ring } = SIZE_MAP[size]
  const displayLabel = label ?? CONTEXT_LABELS[context]

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className,
      )}
      role="status"
      aria-label={displayLabel}
    >
      {/* Pulsing glow ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow */}
        <span
          className={cn(
            "absolute rounded-full animate-ping opacity-20",
            ring,
          )}
          style={{ backgroundColor: "var(--brand-accent, #6C4EF3)" }}
          aria-hidden="true"
        />
        {/* Logo */}
        <div
          className={cn(
            "relative rounded-2xl overflow-hidden shadow-lg",
            "animate-pulse",
          )}
          style={{
            width: logoSize,
            height: logoSize,
            boxShadow: "0 4px 24px rgba(108,78,243,0.4)",
          }}
        >
          <Image
            src={BRAND.logo}
            alt={BRAND.name}
            width={logoSize}
            height={logoSize}
            priority
          />
        </div>
      </div>

      {showLabel && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {displayLabel}
        </p>
      )}
    </div>
  )
}

/** Full-page centered loader */
export function LummyPageLoader({
  context,
  label,
}: Pick<LummyLoaderProps, "context" | "label">) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LummyLoader context={context} label={label} size="lg" />
    </div>
  )
}

/** Inline loader for panels/cards */
export function LummyInlineLoader({
  context,
  label,
}: Pick<LummyLoaderProps, "context" | "label">) {
  return (
    <div className="flex items-center justify-center py-12">
      <LummyLoader context={context} label={label} size="sm" />
    </div>
  )
}
