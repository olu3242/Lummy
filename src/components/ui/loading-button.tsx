"use client"

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { LummyLoader } from "@/components/ui/lummy-loader"
import { cn } from "@/lib/utils"

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ children, className, disabled, isLoading = false, loadingText = "Working...", ...props }, ref) => (
    <Button
      ref={ref}
      className={cn("relative", className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <LummyLoader mode="button" text={loadingText} />
          <span>{loadingText}</span>
        </span>
      ) : children}
    </Button>
  ),
)
LoadingButton.displayName = "LoadingButton"
