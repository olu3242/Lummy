"use client"

import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

type LummyLoaderMode = "fullscreen" | "inline" | "button"

interface LummyLoaderProps {
  mode?: LummyLoaderMode
  text?: string
  subtext?: string
  className?: string
  logoClassName?: string
}

const modeStyles: Record<LummyLoaderMode, { wrap: string; logo: string; text: string }> = {
  fullscreen: {
    wrap: "min-h-screen w-full bg-[#070712] text-white",
    logo: "h-20 w-20 sm:h-24 sm:w-24",
    text: "text-sm sm:text-base",
  },
  inline: {
    wrap: "w-full rounded-2xl border border-white/10 bg-[#070712]/90 px-6 py-10 text-white",
    logo: "h-14 w-14",
    text: "text-sm",
  },
  button: {
    wrap: "inline-flex text-current",
    logo: "h-4 w-4",
    text: "sr-only",
  },
}

export function LummyLoader({
  mode = "inline",
  text = "Preparing your workspace...",
  subtext,
  className,
  logoClassName,
}: LummyLoaderProps) {
  const reduceMotion = useReducedMotion()
  const styles = modeStyles[mode]
  const isButton = mode === "button"

  const logo = (
    <motion.div
      aria-hidden="true"
      className={cn(
        "relative isolate flex items-center justify-center rounded-[28%]",
        styles.logo,
        logoClassName,
      )}
      animate={reduceMotion ? undefined : { scale: [1, 1.045, 1], opacity: [0.92, 1, 0.92] }}
      transition={reduceMotion ? undefined : { duration: 1.65, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="absolute inset-[-18%] rounded-[34%] bg-brand-purple/35 blur-xl" />
      <span className="absolute inset-[-8%] rounded-[32%] bg-brand-indigo/20 blur-md" />
      <Image
        src="/lummy-logo.png"
        alt=""
        width={160}
        height={160}
        priority={mode === "fullscreen"}
        className="relative z-10 h-full w-full object-contain drop-shadow-[0_0_22px_rgba(168,85,247,0.38)]"
        sizes={isButton ? "16px" : "(max-width: 640px) 80px, 96px"}
      />
    </motion.div>
  )

  if (isButton) {
    return (
      <span className={cn("inline-flex items-center justify-center", className)} role="status" aria-label={text}>
        {logo}
        <span className="sr-only">{text}</span>
      </span>
    )
  }

  return (
    <div
      className={cn(
        "relative isolate flex flex-col items-center justify-center overflow-hidden",
        styles.wrap,
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(108,78,243,0.24),transparent_42%)]" />
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {logo}
        <p className={cn("mt-5 font-semibold tracking-normal", styles.text)}>{text}</p>
        {subtext ? <p className="mt-1 max-w-xs text-xs text-white/45">{subtext}</p> : null}
      </motion.div>
    </div>
  )
}
