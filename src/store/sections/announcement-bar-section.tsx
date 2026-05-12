"use client"

import type { SectionProps, AnnouncementSettings } from "../schema/types"
import { accentWithAlpha } from "../themes/utils"

const STYLE_MAP: Record<string, { bg: string; text: string; border: string }> = {
  purple: { bg: "#6C4EF3", text: "#ffffff", border: "#5a3dd4" },
  coral:  { bg: "#F97316", text: "#ffffff", border: "#e06010" },
  green:  { bg: "#10B981", text: "#ffffff", border: "#0ca370" },
  amber:  { bg: "#F59E0B", text: "#000000", border: "#d48a00" },
}

export function AnnouncementBarSection({ section, theme }: SectionProps) {
  const s = section.settings as unknown as AnnouncementSettings
  if (!s.enabled) return null

  const style = STYLE_MAP[s.style ?? "purple"]
  const isCustomAccent = s.style === "purple" && theme.accent !== "#6C4EF3"
  const bg = isCustomAccent ? theme.accent : style.bg
  const text = isCustomAccent ? theme.accentFg : style.text

  return (
    <div
      className="w-full px-4 py-2 flex items-center justify-center gap-3 text-xs font-semibold text-center"
      style={{ backgroundColor: bg, color: text }}
    >
      <span>{s.text}</span>
      {s.ctaLabel && (
        <a
          href={s.ctaUrl || "#"}
          className="underline underline-offset-2 opacity-90 hover:opacity-100 flex-shrink-0"
        >
          {s.ctaLabel} →
        </a>
      )}
    </div>
  )
}
