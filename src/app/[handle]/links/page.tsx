"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  MessageCircle,
  Instagram,
  Twitter,
  BadgeCheck,
  Share2,
  CheckCheck,
  ShoppingBag,
  Zap,
  Music2,
} from "lucide-react"
import { storefrontCreator, buildWhatsAppUrl, buildStoreWhatsAppUrl } from "@/data/mock/storefront"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/globalization"

const socialLinks = [
  {
    id: "whatsapp",
    label: "Chat on WhatsApp",
    icon: MessageCircle,
    iconClass: "text-white",
    className: "bg-[#25D366] hover:bg-[#20b958] text-white",
    href: (phone: string, name: string) => buildStoreWhatsAppUrl(phone, name),
    featured: true,
  },
  {
    id: "instagram",
    label: "Follow on Instagram",
    icon: Instagram,
    iconClass: "text-white",
    className: "bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white hover:opacity-90",
    href: (_: string, __: string, ig?: string) => ig ? `https://instagram.com/${ig.replace("@", "")}` : "#",
  },
  {
    id: "twitter",
    label: "Follow on Twitter / X",
    icon: Twitter,
    iconClass: "text-white",
    className: "bg-foreground text-background hover:opacity-80",
    href: (_: string, __: string, ___?: string, tw?: string) => tw ? `https://twitter.com/${tw.replace("@", "")}` : "#",
  },
  {
    id: "tiktok",
    label: "Watch on TikTok",
    icon: Music2,
    iconClass: "text-white",
    className: "bg-[#010101] dark:bg-white/10 text-white hover:opacity-80",
    href: () => "#",
  },
]

export default function LinkInBioPage({ params }: { params: { handle: string } }) {
  const creator = storefrontCreator
  const [copied, setCopied] = React.useState(false)

  const handleShare = async () => {
    const url = window.location.href.replace("/links", "")
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: creator.storeName, url }); return } catch {}
    }
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const topProducts = creator.publicProducts.slice(0, 4)
  const creatorFirstName = creator.name.split(" ")[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-purple/5 via-background to-background flex flex-col items-center py-10 px-4">
      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4">
            <div className="relative w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-brand-purple/20 shadow-brand">
              <Image src={creator.avatar} alt={creator.name} fill className="object-cover" unoptimized />
            </div>
            {creator.verified && (
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-background border-2 border-background shadow">
                <BadgeCheck className="h-5 w-5 text-brand-purple" />
              </div>
            )}
          </div>

          <h1 className="font-display text-xl font-extrabold">{creator.storeName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">@{creator.handle}</p>
          <p className="text-sm text-foreground mt-3 leading-relaxed max-w-xs">{creator.bio}</p>

          {/* Stats row */}
          <div className="flex items-center gap-5 mt-4">
            <div className="text-center">
              <p className="font-display font-bold text-base">{creator.stats.totalOrders.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Customers</p>
            </div>
            <div className="w-px h-5 bg-border" />
            <div className="text-center">
              <p className="font-display font-bold text-base">{creator.publicProducts.length}</p>
              <p className="text-[10px] text-muted-foreground">Products</p>
            </div>
            <div className="w-px h-5 bg-border" />
            <div className="text-center">
              <p className="font-display font-bold text-base">{creator.stats.avgRating}★</p>
              <p className="text-[10px] text-muted-foreground">Rating</p>
            </div>
          </div>
        </div>

        {/* Social / action links */}
        <div className="space-y-2.5 mb-6">
          {socialLinks.map((link, i) => {
            const Icon = link.icon
            const href =
              link.id === "whatsapp" ? link.href(creator.whatsapp, creator.storeName) :
              link.id === "instagram" ? link.href("", "", creator.socialLinks.instagram) :
              link.id === "twitter" ? link.href("", "", "", creator.socialLinks.twitter) :
              "#"

            return (
              <motion.a
                key={link.id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className={cn(
                  "flex items-center justify-center gap-2.5 w-full h-13 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] py-3.5 shadow-sm",
                  link.className
                )}
              >
                <Icon className={cn("h-4.5 w-4.5 h-5 w-5", link.iconClass)} />
                {link.label}
              </motion.a>
            )
          })}
        </div>

        {/* View full store */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Link
            href={`/${params.handle}`}
            className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl border-2 border-brand-purple/30 text-sm font-semibold text-brand-purple hover:bg-brand-purple/5 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse full store ({creator.publicProducts.length} products)
          </Link>
        </motion.div>

        {/* Featured products */}
        {topProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-7"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 text-center">
              Popular right now
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {topProducts.map((product, i) => {
                const formattedPrice = formatMoney(product.price, (product as { currency?: string }).currency)
                const waUrl = buildWhatsAppUrl(creator.whatsapp, product.name, formattedPrice, creatorFirstName)
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 + i * 0.06 }}
                    className="rounded-2xl border border-border bg-card overflow-hidden"
                  >
                    <Link href={`/${params.handle}/${product.id}`}>
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <Image src={product.image} alt={product.name} fill className="object-cover hover:scale-105 transition-transform duration-300" unoptimized />
                      </div>
                    </Link>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold line-clamp-1">{product.name}</p>
                      <p className="text-xs font-bold text-brand-purple mt-0.5">{formattedPrice}</p>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center justify-center gap-1 w-full h-7 rounded-lg bg-[#25D366] hover:bg-[#20b958] text-white text-[10px] font-semibold transition-colors"
                      >
                        <MessageCircle className="h-3 w-3 fill-white" />
                        Order
                      </a>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Share + powered by */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? "Link copied!" : "Share this page"}
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Powered by
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <div className="flex h-4 w-4 items-center justify-center rounded bg-gradient-to-br from-brand-purple to-brand-indigo">
                <Zap className="h-2.5 w-2.5 text-white fill-white" />
              </div>
              Lummy
            </span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
