"use client"

import { Instagram, Twitter, ExternalLink } from "lucide-react"
import type { SectionProps, SocialLinksSettings } from "../schema/types"
import { accentWithAlpha } from "../themes/utils"

export function SocialLinksSection({ section, theme, creator }: SectionProps) {
  const s = section.settings as unknown as SocialLinksSettings

  const links = [
    creator.socialLinks.instagram && { href: "#", icon: Instagram, label: `@${creator.socialLinks.instagram}`, name: "Instagram" },
    creator.socialLinks.twitter && { href: "#", icon: Twitter, label: `@${creator.socialLinks.twitter}`, name: "Twitter" },
    creator.socialLinks.tiktok && { href: "#", icon: ExternalLink, label: creator.socialLinks.tiktok, name: "TikTok" },
  ].filter(Boolean)

  if (links.length === 0) return null

  return (
    <div className="px-4 py-6">
      {s.title && <h2 className="font-bold text-base mb-4">{s.title}</h2>}
      <div className="flex flex-wrap gap-2">
        {links.map((link, i) => {
          if (!link) return null
          const Icon = link.icon
          return (
            <a
              key={i}
              href={link.href}
              className="flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ borderColor: accentWithAlpha(theme.accent, 0.25), color: theme.accent }}
            >
              <Icon className="h-3.5 w-3.5" />
              {s.showLabels ? link.label : link.name}
            </a>
          )
        })}
      </div>
    </div>
  )
}
