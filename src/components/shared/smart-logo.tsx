"use client"

import * as React from "react"
import Link from "next/link"
import { LummyLogo } from "@/components/branding/lummy-logo"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface SmartLogoProps {
  imageClassName?: string
  textClassName?: string
  className?: string
  imageSize?: number
  showText?: boolean
}

/**
 * Session-aware logo link.
 * Routes unauthenticated users to "/" and authenticated users to "/dashboard".
 * Uses LummyLogo for the visual rendering — single source of truth.
 */
export function SmartLogo({
  imageClassName,
  textClassName,
  className,
  imageSize = 32,
  showText = true,
}: SmartLogoProps) {
  const [href, setHref] = React.useState("/")

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setHref("/dashboard")
    })
  }, [])

  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 group", className)}>
      <LummyLogo
        mode={showText ? "full" : "icon"}
        imageSize={imageSize}
        imageClassName={imageClassName}
        textClassName={textClassName}
        priority
      />
    </Link>
  )
}
