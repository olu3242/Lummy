"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { BRAND } from "@/config/branding"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface SmartLogoProps {
  imageClassName?: string
  textClassName?: string
  className?: string
  imageSize?: number
  showText?: boolean
}

export function SmartLogo({
  imageClassName = "h-8 w-8 rounded-xl",
  textClassName = "font-display text-lg font-bold",
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
      <Image
        src={BRAND.logo}
        alt={BRAND.name}
        width={imageSize}
        height={imageSize}
        className={imageClassName}
        priority
      />
      {showText && (
        <span className={textClassName}>{BRAND.name}</span>
      )}
    </Link>
  )
}
