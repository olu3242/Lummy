import Image from "next/image"
import { BRAND } from "@/config/branding"
import { cn } from "@/lib/utils"

interface LummyLogoProps {
  /** Show icon + text (default) or icon-only */
  mode?: "full" | "icon"
  /** Explicit color scheme override; defaults to context (dark bg assumed) */
  scheme?: "dark" | "light" | "auto"
  imageSize?: number
  imageClassName?: string
  textClassName?: string
  className?: string
  priority?: boolean
}

/**
 * Single source of truth for the Lummy brand logo.
 * Use this in all pages, layouts, and components.
 * For session-aware routing (public ↔ dashboard), wrap with SmartLogo.
 */
export function LummyLogo({
  mode = "full",
  scheme = "auto",
  imageSize = 32,
  imageClassName,
  textClassName,
  className,
  priority = false,
}: LummyLogoProps) {
  const textColor =
    scheme === "light"
      ? "text-slate-900"
      : scheme === "dark"
      ? "text-white"
      : "text-foreground"

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src={BRAND.logo}
        alt={BRAND.name}
        width={imageSize}
        height={imageSize}
        className={cn("shrink-0", imageClassName)}
        priority={priority}
      />
      {mode === "full" && (
        <span
          className={cn(
            "font-display font-bold leading-none select-none",
            textColor,
            textClassName,
          )}
          style={{ fontSize: imageSize * 0.625 }}
        >
          {BRAND.name}
        </span>
      )}
    </span>
  )
}

export type { LummyLogoProps }
