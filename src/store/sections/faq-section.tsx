"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import type { SectionProps, FAQSettings } from "../schema/types"
import { accentWithAlpha } from "../themes/utils"

export function FAQSection({ section, theme }: SectionProps) {
  const s = section.settings as unknown as FAQSettings
  const [open, setOpen] = React.useState<number | null>(null)

  if (!s.items?.length) return null

  return (
    <div className="px-4 py-6">
      <h2 className="font-bold text-base mb-4">{s.title || "FAQ"}</h2>
      <div className="space-y-2">
        {s.items.map((item, i) => (
          <div key={i} className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold hover:bg-accent transition-colors"
            >
              <span>{item.q}</span>
              <ChevronDown
                className="h-4 w-4 flex-shrink-0 transition-transform duration-200"
                style={{
                  transform: open === i ? "rotate(180deg)" : "rotate(0deg)",
                  color: theme.accent,
                }}
              />
            </button>
            {open === i && (
              <div
                className="px-4 pb-3 text-xs opacity-70 leading-relaxed border-t border-border bg-muted/30"
              >
                <div className="pt-2">{item.a}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
