import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        brand: "border-brand-purple/30 bg-brand-purple/10 text-brand-purple",
        "brand-glow": "border-brand-purple/40 bg-brand-purple/15 text-brand-purple shadow-[0_0_12px_rgba(108,78,243,0.2)]",
        green: "border-brand-green/30 bg-brand-green/10 text-brand-green",
        coral: "border-brand-coral/30 bg-brand-coral/10 text-brand-coral",
        glass: "border-white/10 bg-white/8 text-white/80 backdrop-blur-sm",
        dark: "border-white/10 bg-white/5 text-white/70",
        verified: "border-brand-purple/30 bg-brand-purple/10 text-brand-purple",
      },
      size: {
        default: "px-2.5 py-0.5",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
