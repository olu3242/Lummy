"use client"

import { MessageCircle } from "lucide-react"
import type { SectionProps, CTASettings } from "../schema/types"
import { buildStoreWhatsAppUrl } from "@/data/mock/storefront"
import { getButtonRadius, accentWithAlpha } from "../themes/utils"

export function CTASection({ section, theme, creator }: SectionProps) {
  const s = section.settings as unknown as CTASettings
  const btnRadius = getButtonRadius(theme)
  const waUrl = buildStoreWhatsAppUrl(creator.whatsapp, creator.storeName)

  const bg =
    s.style === "dark"
      ? "#111"
      : s.style === "minimal"
      ? "transparent"
      : accentWithAlpha(theme.accent, 0.08)

  const border =
    s.style === "minimal"
      ? `1px solid ${accentWithAlpha(theme.accent, 0.2)}`
      : "none"

  return (
    <div
      className="mx-4 my-6 px-6 py-8 text-center"
      style={{ background: bg, border, borderRadius: "1rem" }}
    >
      <h2
        className="font-bold text-lg mb-2"
        style={{ color: s.style === "dark" ? "#fff" : "inherit" }}
      >
        {s.headline || "Questions? Let's chat!"}
      </h2>
      {s.subtext && (
        <p
          className="text-sm mb-5 opacity-70"
          style={{ color: s.style === "dark" ? "#fff" : "inherit" }}
        >
          {s.subtext}
        </p>
      )}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#25D366", borderRadius: btnRadius }}
      >
        <MessageCircle className="h-4 w-4 fill-white" />
        {s.ctaLabel || "Chat on WhatsApp"}
      </a>
    </div>
  )
}
