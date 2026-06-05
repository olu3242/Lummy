"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, MessageCircle, Share2, CheckCheck, ShoppingBag,
  Eye, BadgeCheck, Star, ChevronRight, Package, CreditCard, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { buildWhatsAppUrl } from "@/data/mock/storefront"
import { cn } from "@/lib/utils"

interface RealProduct {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  image_url: string | null
  creator_id: string | null
  creator_whatsapp: string | null
  store_name: string
  in_stock: boolean
  related_products: Array<{
    id: string
    name: string
    price: number
    currency: string
    image_url: string | null
  }>
}

export function ProductDetailClient({
  handle,
  productId,
}: {
  handle: string
  productId: string
}) {
  const [product, setProduct] = React.useState<RealProduct | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0)

  React.useEffect(() => {
    fetch(`/api/storefront/${handle}/product/${productId}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(({ data }) => { if (data) setProduct(data); else setError(true) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [handle, productId])

  const handleShare = async () => {
    const url = window.location.href
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: product?.name ?? "Product", url }); return } catch {}
    }
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-sm text-center">This product is not available.</p>
        <Link href={`/${handle}`} className="text-brand-purple text-sm font-medium hover:underline">
          ← Back to store
        </Link>
      </div>
    )
  }

  const displayPrice = Math.round(product.price / 100) // kobo → Naira
  const image = product.image_url ?? "/placeholder-product.jpg"
  const galleryImages = [image]
  const activeImage = galleryImages[selectedImageIndex] ?? image
  const relatedProducts = product.related_products ?? []

  const waNumber = (product.creator_whatsapp ?? "").replace(/\D/g, "")
  const whatsappUrl = waNumber
    ? buildWhatsAppUrl(waNumber, product.name, `₦${displayPrice.toLocaleString()}`, product.store_name.split(" ")[0])
    : null

  return (
    <>
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between px-4 bg-background/90 backdrop-blur-sm border-b border-border">
        <Link href={`/${handle}`} className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> {product.store_name}
        </Link>
        <button onClick={handleShare} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border hover:bg-accent transition-colors">
          {copied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Share2 className="h-3.5 w-3.5" />}
        </button>
      </header>

      <div className="pb-32 lg:pb-12">
        {/* Image */}
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
                <Image src={activeImage} alt={product.name} fill className="object-cover" priority unoptimized />
              </motion.div>
            </AnimatePresence>
            {!product.in_stock && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                <span className="font-display text-xl font-extrabold px-5 py-2.5 rounded-2xl bg-background border border-border shadow">Sold Out</span>
              </div>
            )}
          </div>
          {galleryImages.length > 1 && (
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
          )}
        </div>

        {/* Info */}
        <div className="px-4 pt-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-display text-2xl font-extrabold leading-snug">{product.name}</h1>
            <p className="font-display text-2xl font-extrabold text-brand-purple flex-shrink-0">₦{displayPrice.toLocaleString()}</p>
          </div>
          {product.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          ) : null}

          {/* Delivery */}
          <div className="flex gap-3 p-3.5 rounded-2xl bg-muted/50 border border-border">
            <Package className="h-4 w-4 text-brand-green flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold">Delivery available</p>
              <p className="text-muted-foreground mt-0.5">Lagos: 1–2 days · Other states: 3–5 days</p>
            </div>
          </div>

          {relatedProducts.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">You may also like</h2>
                <Link href={`/${handle}`} className="text-xs font-medium text-brand-purple hover:underline">
                  View store
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {relatedProducts.map((item) => {
                  const itemPrice = Math.round(item.price / 100)
                  return (
                    <Link
                      key={item.id}
                      href={`/${handle}/${item.id}`}
                      className="overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:bg-accent"
                    >
                      <div className="relative aspect-square bg-muted">
                        <Image
                          src={item.image_url ?? "/placeholder-product.jpg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="space-y-1 p-3">
                        <p className="line-clamp-2 text-xs font-semibold leading-snug">{item.name}</p>
                        <p className="text-xs font-bold text-brand-purple">₦{itemPrice.toLocaleString()}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          ) : null}

          {/* Seller */}
          <Link href={`/${handle}`} className="flex items-center gap-3 p-3.5 rounded-2xl border border-border hover:bg-accent transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold">{product.store_name}</p>
                <BadgeCheck className="h-3.5 w-3.5 text-brand-purple" />
              </div>
              <p className="text-xs text-muted-foreground">View all products</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </Link>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-20 px-4 pt-3 pb-4 bg-background/90 backdrop-blur-sm border-t border-border">
        {!product.in_stock ? (
          <div className="w-full h-12 rounded-2xl border-2 border-border flex items-center justify-center text-sm font-semibold text-muted-foreground">
            This product is currently sold out
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href={`/${handle}/${productId}/checkout`} className="flex-1">
              <Button size="xl" className="w-full gap-2">
                <CreditCard className="h-5 w-5" />
                Buy Now — ₦{displayPrice.toLocaleString()}
              </Button>
            </Link>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="whatsapp" size="xl" className="gap-2 px-4">
                  <MessageCircle className="h-5 w-5 fill-white" />
                </Button>
              </a>
            )}
          </div>
        )}
      </div>
    </>
  )
}
