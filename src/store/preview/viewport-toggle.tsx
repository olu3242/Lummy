"use client"

import { Smartphone, Tablet, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

export type Viewport = "mobile" | "tablet" | "desktop"

const VIEWPORTS: { id: Viewport; label: string; Icon: typeof Smartphone }[] = [
  { id: "mobile", label: "Mobile", Icon: Smartphone },
  { id: "tablet", label: "Tablet", Icon: Tablet },
  { id: "desktop", label: "Desktop", Icon: Monitor },
]

interface ViewportToggleProps {
  viewport: Viewport
  onChange: (v: Viewport) => void
}

export function ViewportToggle({ viewport, onChange }: ViewportToggleProps) {
  return (
    <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-muted/60 border border-border w-fit mx-auto">
      {VIEWPORTS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
            viewport === id
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
