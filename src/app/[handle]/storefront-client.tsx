"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { AnimatePresence } from "framer-motion"
import {
  MessageCircle, Share2, Instagram, Twitter, MapPin, Star,
  ShoppingBag, BadgeCheck, CheckCheck, ExternalLink, Search,
  Eye, X, ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  storefrontCreator, mockStorefrontReviews,
  buildWhatsAppUrl, buildStoreWhatsAppUrl,
  type StorefrontProduct,
} from "@/data/mock/storefront"
import { cn } from "@/lib/utils"
import { StorefrontRenderer } from "@/store/renderer/storefront-renderer"
import { migrateToStoreSchema } from "@/store/schema/migrate"
import { DEFAULT_SCHEMA } from "@/store/schema/defaults"
import type { StoreSchema } from "@/store/schema/types"
import type { Json } from "@/lib/supabase/types"

const SCHEMA_KEY = "lummy_store_schema_v2"
const OLD_KEY = "lummy_store_settings"

function loadPublicSchema(serverSchema: Json | null): StoreSchema {
  // Server-provided schema (from Supabase) takes precedence
  if (serverSchema && typeof serverSchema === "object" && !Array.isArray(serverSchema)) {
    try { return migrateToStoreSchema(serverSchema) } catch {}
  }
  // Fall back to localStorage (creator's own device) then default
  if (typeof window === "undefined") return DEFAULT_SCHEMA
  try {
    const newRaw = localStorage.getItem(SCHEMA_KEY)
    if (newRaw) return migrateToStoreSchema(JSON.parse(newRaw))
    const oldRaw = localStorage.getItem(OLD_KEY)
    if (oldRaw) return migrateToStoreSchema(JSON.parse(oldRaw))
  } catch {}
  return DEFAULT_SCHEMA
}

function QuickViewModal({
  product, handle, onClose,
}: {
  product: StorefrontProduct; handle: string; onClose: () => void
}) {
  const creator = storefrontCreator
  const creatorFirstName = creator.name.split(" ")[0]
  const whatsappUrl = buildWhatsAppUrl(creator.whatsapp, product.name, `₦${product.price.toLocaleString()}`, creatorFirstName)
  const isOutOfStock = product.stock === 0

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-border bg-card overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <span className="font-display text-lg font-extrabold px-4 py-2 rounded-2xl bg-background border border-border shadow">Sold Out</span>
            </div>
          )}
          {!isOutOfStock && product.stock !== null && product.stock <= 5 && product.stock > 0 && (
            <div className="absolute top-3 left-3">
              <Badge variant="coral" className="shadow-sm">Only {product.stock} left</Badge>
            </div>
          )}
          <button onClick={onClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Badge variant="brand" size="sm" className="mb-1.5">{product.category}</Badge>
              <h2 className="font-display text-xl font-extrabold leading-snug">{product.name}</h2>
            </div>
            <p className="font-display text-xl font-extrabold text-brand-purple flex-shrink-0">₦{product.price.toLocaleString()}</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{product.description}</p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground py-2 border-y border-border">
            <div className="flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5 text-brand-purple" /><strong className="text-foreground">{product.sales}</strong> sold</div>
            <div className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-brand-coral" /><strong className="text-foreground">{product.views.toLocaleString()}</strong> views</div>
            <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /><strong className="text-foreground">4.9</strong> rating</div>
          </div>

          <div className="flex gap-2">
            {isOutOfStock ? (
              <div className="flex-1 flex items-center justify-center h-11 rounded-2xl border-2 border-border text-sm font-semibold text-muted-foreground">
                Currently sold out
              </div>
            ) : (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="whatsapp" size="lg" className="w-full gap-2 h-11">
                  <MessageCircle className="h-4 w-4 fill-white" /> Order via WhatsApp
                </Button>
              </a>
            )}
            <Link href={`/${handle}/${product.id}`} onClick={onClose}
              className="flex h-11 items-center gap-1.5 px-4 rounded-2xl border border-border text-xs font-semibold hover:bg-accent transition-colors flex-shrink-0">
              Full details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ShareButton({ url, storeName }: { url: string; storeName: string }) {
  const [copied, setCopied] = React.useState(false)
  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: storeName, url }); return } catch {}
    }
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }
  return (
    <button onClick={handleShare} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-accent transition-colors">
      {copied ? <CheckCheck className="h-4 w-4 text-brand-green" /> : <Share2 className="h-4 w-4" />}
    </button>
  )
}

function StarRow({ rating, small }: { rating: number; small?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={cn(small ? "h-3 w-3" : "h-3.5 w-3.5", n <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30")} />
      ))}
    </div>
  )
}

export function StorefrontClient({
  handle,
  dbCreatorId: _dbCreatorId,
  dbStoreSchema,
}: {
  handle: string
  dbCreatorId?: string
  dbStoreSchema?: Json | null
}) {
  const creator = storefrontCreator
  const [schema, setSchema] = React.useState<StoreSchema | null>(null)

  const storeUrl = `https://lummy.co/${creator.handle}`

  React.useEffect(() => {
    setSchema(loadPublicSchema(dbStoreSchema ?? null))
  }, [dbStoreSchema])

  if (!schema) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between px-4 bg-background/90 backdrop-blur-sm border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground truncate max-w-[160px]">
            lummy.co/{creator.handle}
          </span>
        </header>
        <div className="flex-1 flex items-center justify-center py-20 text-muted-foreground text-sm">
          Loading store…
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Sticky header — always shown */}
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between px-4 bg-background/90 backdrop-blur-sm border-b border-border">
        <Link href={storeUrl} className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors truncate max-w-[160px]">
          lummy.co/{creator.handle}
        </Link>
        <div className="flex items-center gap-2">
          <ShareButton url={storeUrl} storeName={creator.storeName} />
          <a href={buildStoreWhatsAppUrl(creator.whatsapp, creator.storeName)} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="whatsapp" className="gap-1.5 h-8 text-xs">
              <MessageCircle className="h-3.5 w-3.5 fill-white" /> Chat
            </Button>
          </a>
        </div>
      </header>

      {/* Schema-driven sections */}
      <div className="pb-28 lg:pb-8">
        <StorefrontRenderer schema={schema} creator={creator} />
      </div>

      {/* Mobile sticky CTA — safe-area aware for iOS */}
      <div className="fixed bottom-0 inset-x-0 z-20 px-4 pt-3 pb-4 pb-safe bg-background/90 backdrop-blur-sm border-t border-border lg:hidden">
        <a href={buildStoreWhatsAppUrl(creator.whatsapp, creator.storeName)} target="_blank" rel="noopener noreferrer">
          <Button variant="whatsapp" size="lg" className="w-full gap-2">
            <MessageCircle className="h-5 w-5 fill-white" /> Order from {creator.storeName}
          </Button>
        </a>
      </div>
    </>
  )
}
