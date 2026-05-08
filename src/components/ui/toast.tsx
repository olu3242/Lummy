"use client"

import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { X, CheckCheck, AlertTriangle, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitive.Provider
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[380px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

type ToastVariant = "default" | "success" | "error" | "warning"

const variantStyles: Record<ToastVariant, { root: string; icon: React.ElementType; iconClass: string }> = {
  default:  { root: "border-border bg-card",                     icon: Info,          iconClass: "text-brand-purple" },
  success:  { root: "border-brand-green/30 bg-brand-green/5",    icon: CheckCheck,    iconClass: "text-brand-green" },
  error:    { root: "border-destructive/30 bg-destructive/5",    icon: XCircle,       iconClass: "text-destructive" },
  warning:  { root: "border-amber-500/30 bg-amber-500/5",        icon: AlertTriangle, iconClass: "text-amber-500" },
}

interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  variant?: ToastVariant
  title?: string
  description?: string
}

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Root>, ToastProps>(
  ({ className, variant = "default", title, description, children, ...props }, ref) => {
    const cfg = variantStyles[variant]
    const Icon = cfg.icon
    return (
      <ToastPrimitive.Root
        ref={ref}
        className={cn(
          "group pointer-events-auto relative flex items-start gap-3 w-full rounded-2xl border p-4 shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
          "data-[state=open]:slide-in-from-bottom-5",
          cfg.root,
          className
        )}
        {...props}
      >
        <Icon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", cfg.iconClass)} />
        <div className="flex-1 min-w-0">
          {title && (
            <ToastPrimitive.Title className="text-sm font-semibold leading-snug">
              {title}
            </ToastPrimitive.Title>
          )}
          {description && (
            <ToastPrimitive.Description className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {description}
            </ToastPrimitive.Description>
          )}
          {children}
        </div>
        <ToastPrimitive.Close className="flex-shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100">
          <X className="h-3.5 w-3.5" />
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
    )
  }
)
Toast.displayName = "Toast"

export { ToastProvider, ToastViewport, Toast, type ToastVariant }
