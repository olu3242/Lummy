"use client"

import Image from "next/image"
import { BadgeCheck, MapPin, Instagram, Twitter, ExternalLink, MessageCircle } from "lucide-react"
import type { SectionProps, CreatorBioSettings } from "../schema/types"
import { buildStoreWhatsAppUrl, buildWhatsAppUrl } from "@/data/mock/storefront"
import { getButtonRadius, accentWithAlpha } from "../themes/utils"

export function CreatorBioSection({ section, theme, creator }: SectionProps) {
  const s = section.settings as unknown as CreatorBioSettings
  const btnRadius = getButtonRadius(theme)
  const storeUrl = `https://lummy.co/${creator.handle}`

  return (
    <div>
      {/* Cover */}
      <div className="relative h-40 sm:h-48 overflow-hidden bg-muted">
        <Image src={creator.cover} alt="Store cover" fill className="object-cover" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
      </div>

      <div className="relative px-4 pb-5">
        {/* Avatar */}
        <div className="relative -mt-9 mb-3 w-fit">
          <div
            className="relative w-18 h-18 overflow-hidden ring-4 ring-background shadow-lg"
            style={{ width: 72, height: 72, borderRadius: "1rem" }}
          >
            <Image src={creator.avatar} alt={creator.name} fill className="object-cover" unoptimized />
          </div>
          {creator.verified && (
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border">
              <BadgeCheck className="h-3.5 w-3.5" style={{ color: theme.accent }} />
            </div>
          )}
        </div>

        {/* Name row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h1 className="font-bold text-lg leading-snug flex items-center gap-1.5">
              {creator.storeName}
              {creator.verified && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: accentWithAlpha(theme.accent, 0.15),
                    color: theme.accent,
                  }}
                >
                  Verified
                </span>
              )}
            </h1>
            {s.showLocation && (
              <p className="text-xs opacity-60 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {creator.name} · {creator.location}
              </p>
            )}
          </div>
        </div>

        <p className="text-sm opacity-80 leading-relaxed mt-2">{creator.bio}</p>

        {/* Stats */}
        {s.showStats && (
          <div className="mt-4 flex items-center gap-5">
            <div className="text-center">
              <p className="font-bold text-sm">{creator.stats.totalOrders.toLocaleString()}</p>
              <p className="text-[10px] opacity-50">Customers</p>
            </div>
            <div className="w-px h-5 opacity-20 bg-current" />
            <div className="text-center">
              <p className="font-bold text-sm">{creator.publicProducts.length}</p>
              <p className="text-[10px] opacity-50">Products</p>
            </div>
            <div className="w-px h-5 opacity-20 bg-current" />
            <div className="text-center">
              <p className="font-bold text-sm flex items-center gap-0.5">
                {creator.stats.avgRating}<span className="text-amber-400">★</span>
              </p>
              <p className="text-[10px] opacity-50">{creator.stats.reviewCount} reviews</p>
            </div>
          </div>
        )}

        {/* Socials */}
        {s.showSocials && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {creator.socialLinks.instagram && (
              <a
                href="#"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs opacity-70 hover:opacity-100 transition-opacity"
                style={{ borderColor: accentWithAlpha(theme.accent, 0.2) }}
              >
                <Instagram className="h-3 w-3" /> {creator.socialLinks.instagram}
              </a>
            )}
            {creator.socialLinks.twitter && (
              <a
                href="#"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs opacity-70 hover:opacity-100 transition-opacity"
                style={{ borderColor: accentWithAlpha(theme.accent, 0.2) }}
              >
                <Twitter className="h-3 w-3" /> {creator.socialLinks.twitter}
              </a>
            )}
            <a
              href={`/${creator.handle}/links`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs opacity-70 hover:opacity-100 transition-opacity"
              style={{ borderColor: accentWithAlpha(theme.accent, 0.2) }}
            >
              <ExternalLink className="h-3 w-3" /> Link-in-bio
            </a>
          </div>
        )}

        {/* WhatsApp CTA */}
        <div className="mt-4">
          <a
            href={buildStoreWhatsAppUrl(creator.whatsapp, creator.storeName)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "#25D366",
              borderRadius: btnRadius,
            }}
          >
            <MessageCircle className="h-4 w-4 fill-white" />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
