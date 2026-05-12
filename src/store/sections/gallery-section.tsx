"use client"

import Image from "next/image"
import type { SectionProps, GallerySettings } from "../schema/types"
import { getCardRadius, getCardShadow } from "../themes/utils"
import { cn } from "@/lib/utils"

export function GallerySection({ section, theme, creator }: SectionProps) {
  const s = section.settings as unknown as GallerySettings
  const cardRadius = getCardRadius(theme)
  const cardShadow = getCardShadow(theme)

  const images = creator.publicProducts
    .slice(0, s.maxImages ?? 9)
    .map(p => ({ src: p.image, alt: p.name }))

  const cols =
    s.columns === 2 ? "grid-cols-2"
    : s.columns === 4 ? "grid-cols-2 sm:grid-cols-4"
    : "grid-cols-3"

  if (images.length === 0) return null

  return (
    <div className="px-4 py-6">
      {s.title && <h2 className="font-bold text-base mb-4">{s.title}</h2>}
      <div className={cn("grid gap-2", cols)}>
        {images.map((img, i) => (
          <div
            key={i}
            className="relative aspect-square overflow-hidden bg-muted"
            style={{ borderRadius: cardRadius, boxShadow: cardShadow }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  )
}
