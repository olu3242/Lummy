"use client"

import { Star } from "lucide-react"
import type { SectionProps, TestimonialsSettings } from "../schema/types"
import { mockStorefrontReviews } from "@/data/mock/storefront"
import { getCardRadius, getCardShadow, accentWithAlpha } from "../themes/utils"
import { cn } from "@/lib/utils"

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={cn("h-3 w-3", n <= rating ? "text-amber-400 fill-amber-400" : "opacity-20")} />
      ))}
    </div>
  )
}

export function TestimonialsSection({ section, theme, creator }: SectionProps) {
  const s = section.settings as unknown as TestimonialsSettings
  const cardRadius = getCardRadius(theme)
  const cardShadow = getCardShadow(theme)
  const reviews = mockStorefrontReviews.slice(0, s.maxCount ?? 4)

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-base flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          {s.title || "What customers say"}
          <span className="text-xs font-normal opacity-50">({creator.stats.reviewCount})</span>
        </h2>
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-sm">{creator.stats.avgRating}</p>
          <StarRow rating={5} />
        </div>
      </div>

      <div className={cn(
        "gap-3",
        s.layout === "list" ? "flex flex-col" : "grid grid-cols-1 sm:grid-cols-2"
      )}>
        {reviews.map(review => (
          <div
            key={review.id}
            className="border border-border bg-card p-4"
            style={{ borderRadius: cardRadius, boxShadow: cardShadow }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: accentWithAlpha(theme.accent, 0.1), color: theme.accent }}
                >
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold">{review.name}</p>
                  <p className="text-[10px] opacity-50">{review.date}</p>
                </div>
              </div>
              <StarRow rating={review.rating} />
            </div>
            <p className="mt-3 text-xs opacity-70 leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
            <p className="mt-2 text-[10px] font-medium" style={{ color: accentWithAlpha(theme.accent, 0.7) }}>
              Purchased: {review.productName}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
