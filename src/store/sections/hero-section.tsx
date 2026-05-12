"use client"

import type { SectionProps, HeroSettings } from "../schema/types"
import { getButtonRadius, accentWithAlpha } from "../themes/utils"

export function HeroSection({ section, theme, creator }: SectionProps) {
  const s = section.settings as unknown as HeroSettings
  const btnRadius = getButtonRadius(theme)
  const isCentered = s.layout !== "split-left" && s.layout !== "split-right"
  const bg =
    s.backgroundStyle === "gradient"
      ? `linear-gradient(135deg, ${accentWithAlpha(theme.accent, 0.12)}, transparent)`
      : "transparent"

  return (
    <div
      className="px-5 py-10"
      style={{ background: bg }}
    >
      <div className={isCentered ? "text-center max-w-lg mx-auto" : "flex items-center gap-6"}>
        <div className={isCentered ? "" : "flex-1"}>
          <h1
            className="text-2xl font-extrabold leading-tight mb-3"
            style={{ color: "var(--foreground, #111)" }}
          >
            {s.headline}
          </h1>
          {s.subheadline && (
            <p className="text-sm opacity-70 mb-5 leading-relaxed">{s.subheadline}</p>
          )}
          <a
            href="#products"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: theme.accent,
              color: theme.accentFg,
              borderRadius: btnRadius,
            }}
          >
            {s.ctaLabel || "Shop Now"}
          </a>

          {s.showStats && (
            <div className="flex items-center gap-5 mt-6 justify-center">
              <div className="text-center">
                <p className="font-bold text-base">{creator.stats.totalOrders.toLocaleString()}+</p>
                <p className="text-[10px] opacity-60">Happy customers</p>
              </div>
              <div className="w-px h-6 opacity-20 bg-current" />
              <div className="text-center">
                <p className="font-bold text-base">{creator.publicProducts.length}</p>
                <p className="text-[10px] opacity-60">Products</p>
              </div>
              <div className="w-px h-6 opacity-20 bg-current" />
              <div className="text-center">
                <p className="font-bold text-base">{creator.stats.avgRating}★</p>
                <p className="text-[10px] opacity-60">{creator.stats.reviewCount} reviews</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
