"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, MessageCircle, Share2, CheckCheck, ShoppingBag,
  Eye, BadgeCheck, Star, ChevronRight, Package, CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { storefrontCreator, buildWhatsAppUrl } from "@/data/mock/storefront"
import { cn } from "@/lib/utils"

export function ProductDetailClient({
  handle,
  productId,
}: {
  handle: string
  productId: string
}) {
  const creator = storefrontCreator
  const product = creator.publicProducts.find(p => p.id === productId)
  const creatorFirstName = creator.name.split(" ")[0]
  const [copied, setCopied] = React.useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0)

  const p = product ?? creator.publicProducts[0]
  if (!p) return null

  const isOutOfStock = p.stock === 0

  // Gallery: main product image + contextual extras sourced from Unsplash
  const galleryImages = [
    p.image,
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
  ]
  const activeImage = galleryImages[selectedImageIndex]

  const whatsappUrl = buildWhatsAppUrl(creator.whatsapp, p.name, `₦${p.price.toLocaleString()}`, creatorFirstName)

  const related = creator.publicProducts.filter(x => x.id !== p.id).slice(0, 4)

  const handleShare = async () => {
    const url = window.location.href
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: p.name, url }); return } catch {}
    }
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between px-4 bg-background/90 backdrop-blur-sm border-b border-border">
        <Link href={`/${handle}`} className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> {creator.storeName}
        </Link>
        <button onClick={handleShare} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border hover:bg-accent transition-colors">
          {copied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Share2 className="h-3.5 w-3.5" />}
        </button>
      </header>

      <div className="pb-32 lg:pb-12">
        {/* Image gallery */}
        <div>
          <div className="relative aspect-square max-h-[480px] overflow-hidden bg-muted">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <Image src={activeImage} alt={p.name} fill className="object-cover" priority unoptimized />
              </motion.div>
            </AnimatePresence>
            {isOutOfStock && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                <span className="font-display text-xl font-extrabold px-5 py-2.5 rounded-2xl bg-background border border-border shadow">Sold Out</span>
              </div>
            )}
            {!isOutOfStock && p.stock !== null && p.stock <= 5 && p.stock > 0 && (
              <div className="absolute top-3 left-3">
                <Badge variant="coral" className="shadow-sm">Only {p.stock} left</Badge>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 px-4 pt-3">
            {galleryImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImageIndex(i)}
                className={cn(
                  "relative w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-200",
                  selectedImageIndex === i
                    ? "border-brand-purple shadow-brand-sm"
                    : "border-border opacity-60 hover:opacity-100"
                )}
              >
                <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" unoptimized />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="px-4 pt-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Badge variant="brand" size="sm" className="mb-2">{p.category}</Badge>
              <h1 className="font-display text-2xl font-extrabold leading-snug">{p.name}</h1>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-display text-2xl font-extrabold text-brand-purple">₦{p.price.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>

          {/* Stats */}
          <div className="flex items-center gap-4 py-3 border-y border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5 text-brand-purple" />
              <span><strong className="text-foreground">{p.sales}</strong> sold</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-brand-coral" />
              <span><strong className="text-foreground">{p.views.toLocaleString()}</strong> views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span><strong className="text-foreground">4.9</strong> rating</span>
            </div>
          </div>

          {/* Delivery */}
          <div className="flex gap-3 p-3.5 rounded-2xl bg-muted/50 border border-border">
            <Package className="h-4 w-4 text-brand-green flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold">Delivery available</p>
              <p className="text-muted-foreground mt-0.5">Lagos: 1-2 days · Other states: 3-5 days · GIG Logistics</p>
            </div>
          </div>

          {/* Seller */}
          <Link href={`/${handle}`} className="flex items-center gap-3 p-3.5 rounded-2xl border border-border hover:bg-accent transition-colors">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
              <Image src={creator.avatar} alt={creator.name} fill className="object-cover" unoptimized />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold">{creator.storeName}</p>
                {creator.verified && <BadgeCheck className="h-3.5 w-3.5 text-brand-purple" />}
              </div>
              <p className="text-xs text-muted-foreground">{creator.stats.totalOrders.toLocaleString()} happy customers</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </Link>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-8 px-4">
            <h2 className="font-display font-bold text-base mb-4">More from this store</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {related.map(rel => {
                const relUrl = buildWhatsAppUrl(creator.whatsapp, rel.name, `₦${rel.price.toLocaleString()}`, creatorFirstName)
                return (
                  <motion.div key={rel.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="group rounded-2xl border border-border bg-card overflow-hidden">
                    <Link href={`/${handle}/${rel.id}`}>
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <Image src={rel.image} alt={rel.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                      </div>
                    </Link>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold line-clamp-1">{rel.name}</p>
                      <p className="text-xs font-bold text-brand-purple mt-0.5">₦{rel.price.toLocaleString()}</p>
                      <a href={relUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-1 w-full h-7 rounded-lg bg-[#25D366] hover:bg-[#20b958] text-white text-[10px] font-semibold transition-colors">
                        <MessageCircle className="h-3 w-3 fill-white" /> Order
                      </a>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-20 px-4 pt-3 pb-4 pb-safe bg-background/90 backdrop-blur-sm border-t border-border">
        {isOutOfStock ? (
          <div className="w-full h-12 rounded-2xl border-2 border-border flex items-center justify-center text-sm font-semibold text-muted-foreground">
            This product is currently sold out
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href={`/${handle}/${productId}/checkout`} className="flex-1">
              <Button size="xl" className="w-full gap-2">
                <CreditCard className="h-5 w-5" />
                Buy Now — ₦{p.price.toLocaleString()}
              </Button>
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="whatsapp" size="xl" className="gap-2 px-4">
                <MessageCircle className="h-5 w-5 fill-white" />
              </Button>
            </a>
          </div>
        )}
      </div>
    </>
  )
}
