"use client"

import Image from "next/image"
import Link from "next/link"
import { MessageCircle } from "lucide-react"
import type { SectionProps, FeaturedCollectionSettings } from "../schema/types"
import { buildWhatsAppUrl } from "@/data/mock/storefront"
import { getButtonRadius, getCardRadius, getCardShadow, accentWithAlpha } from "../themes/utils"

export function FeaturedCollectionSection({ section, theme, creator }: SectionProps) {
  const s = section.settings as unknown as FeaturedCollectionSettings
  const firstName = creator.name.split(" ")[0]
  const cardRadius = getCardRadius(theme)
  const cardShadow = getCardShadow(theme)
  const btnRadius = getButtonRadius(theme)

  const products = s.productIds?.length
    ? creator.publicProducts.filter(p => s.productIds.includes(p.id)).slice(0, s.maxProducts ?? 4)
    : creator.publicProducts.filter(p => p.sales > 0).sort((a, b) => b.sales - a.sales).slice(0, s.maxProducts ?? 4)

  if (products.length === 0) return null

  return (
    <div className="px-4 py-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-1 w-6 rounded-full" style={{ backgroundColor: theme.accent }} />
          <h2 className="font-bold text-base">{s.title || "Featured Picks"}</h2>
        </div>
        {s.subtitle && <p className="text-xs opacity-50 ml-8">{s.subtitle}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {products.map(product => {
          const whatsappUrl = buildWhatsAppUrl(creator.whatsapp, product.name, `₦${product.price.toLocaleString()}`, firstName)
          const outOfStock = product.stock === 0

          return (
            <div
              key={product.id}
              className="border border-border bg-card overflow-hidden group"
              style={{ borderRadius: cardRadius, boxShadow: cardShadow }}
            >
              <Link href={`/${creator.handle}/${product.id}`}>
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                  {outOfStock && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-background border border-border">Sold out</span>
                    </div>
                  )}
                  <div
                    className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: accentWithAlpha(theme.accent, 0.15), color: theme.accent }}
                  >
                    Featured
                  </div>
                </div>
              </Link>
              <div className="p-3">
                <p className="text-xs font-semibold line-clamp-2 mb-1">{product.name}</p>
                <p className="font-bold text-sm mb-2" style={{ color: theme.accent }}>₦{product.price.toLocaleString()}</p>
                {!outOfStock && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full h-7 text-[10px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#25D366", borderRadius: btnRadius }}
                  >
                    <MessageCircle className="h-3 w-3 fill-white" /> Order
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
