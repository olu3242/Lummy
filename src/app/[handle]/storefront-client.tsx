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

export function StorefrontClient({ handle }: { handle: string }) {
  const creator = storefrontCreator
  const [activeCategory, setActiveCategory] = React.useState("All")
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [quickView, setQuickView] = React.useState<StorefrontProduct | null>(null)
  const PAGE_SIZE = 6

  const storeUrl = `https://lummy.co/${creator.handle}`
  const creatorFirstName = creator.name.split(" ")[0]

  const filtered = creator.publicProducts.filter(p => {
    const matchCat = activeCategory === "All" || p.category === activeCategory
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const paginated = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = paginated.length < filtered.length

  React.useEffect(() => { setPage(1) }, [activeCategory, search])

  return (
    <>
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

      {/* Cover + profile */}
      <div>
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <Image src={creator.cover} alt="Store cover" fill className="object-cover" priority unoptimized />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
        </div>
        <div className="relative px-4 pb-6">
          <div className="relative -mt-10 mb-3 w-fit">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-background shadow-lg">
              <Image src={creator.avatar} alt={creator.name} fill className="object-cover" unoptimized />
            </div>
            {creator.verified && (
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border">
                <BadgeCheck className="h-4 w-4 text-brand-purple" />
              </div>
            )}
          </div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="font-display text-xl font-extrabold flex items-center gap-1.5">
                {creator.storeName}
                {creator.verified && <Badge variant="brand" size="sm">Verified</Badge>}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5" /> {creator.name} · {creator.location}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-foreground leading-relaxed">{creator.bio}</p>
          <div className="mt-4 flex items-center gap-5">
            <div className="text-center">
              <p className="font-display font-bold text-base">{creator.stats.totalOrders.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Customers</p>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="text-center">
              <p className="font-display font-bold text-base">{creator.publicProducts.length}</p>
              <p className="text-[10px] text-muted-foreground">Products</p>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="text-center flex flex-col items-center">
              <p className="font-display font-bold text-base flex items-center gap-0.5">
                {creator.stats.avgRating}<Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 ml-0.5" />
              </p>
              <p className="text-[10px] text-muted-foreground">{creator.stats.reviewCount} reviews</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {creator.socialLinks.instagram && (
              <a href="#" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
                <Instagram className="h-3 w-3" /> {creator.socialLinks.instagram}
              </a>
            )}
            {creator.socialLinks.twitter && (
              <a href="#" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
                <Twitter className="h-3 w-3" /> {creator.socialLinks.twitter}
              </a>
            )}
            <Link href={`/${handle}/links`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
              <ExternalLink className="h-3 w-3" /> Link-in-bio
            </Link>
          </div>
          <div className="mt-4 flex gap-2">
            <a href={buildStoreWhatsAppUrl(creator.whatsapp, creator.storeName)} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="whatsapp" size="lg" className="w-full gap-2">
                <MessageCircle className="h-5 w-5 fill-white" /> Chat on WhatsApp
              </Button>
            </a>
            <ShareButton url={storeUrl} storeName={creator.storeName} />
          </div>
        </div>
      </div>

      <div className="h-2 bg-muted/60 border-y border-border" />

      {/* Products */}
      <div className="px-4 pt-5 pb-28 lg:pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-base flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-brand-purple" /> Products
          </h2>
          <p className="text-xs text-muted-foreground">{filtered.length} available</p>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
          {creator.categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                activeCategory === cat ? "bg-brand-purple text-white border-brand-purple" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No products found</p>
            <p className="text-xs mt-1">Try a different search or category</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {paginated.map((product, i) => {
                const whatsappUrl = buildWhatsAppUrl(creator.whatsapp, product.name, `₦${product.price.toLocaleString()}`, creatorFirstName)
                const isOutOfStock = product.stock === 0
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className={cn("group rounded-2xl border border-border bg-card overflow-hidden", isOutOfStock && "opacity-60")}
                  >
                    <div className="block relative">
                      <Link href={`/${handle}/${product.id}`}>
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          <Image src={product.image} alt={product.name} fill className={cn("object-cover transition-transform duration-300", !isOutOfStock && "group-hover:scale-105")} unoptimized />
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-background border border-border">Sold out</span>
                            </div>
                          )}
                          {!isOutOfStock && product.stock !== null && product.stock <= 5 && (
                            <div className="absolute bottom-2 left-2">
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white">
                                Only {product.stock} left
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                      {/* Quick view button */}
                      {!isOutOfStock && (
                        <button onClick={() => setQuickView(product)}
                          className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 h-7 rounded-lg bg-background/90 backdrop-blur-sm border border-border text-[10px] font-semibold hover:bg-background transition-all">
                          <Eye className="h-3 w-3" /> Quick view
                        </button>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold leading-snug line-clamp-2 mb-1">{product.name}</p>
                      <p className="font-display font-bold text-sm text-brand-purple">₦{product.price.toLocaleString()}</p>
                      {isOutOfStock ? (
                        <div className="mt-2.5 flex items-center justify-center w-full h-8 rounded-xl border border-border text-xs text-muted-foreground font-semibold">
                          Out of stock
                        </div>
                      ) : (
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-2.5 flex items-center justify-center gap-1.5 w-full h-8 rounded-xl bg-[#25D366] hover:bg-[#20b958] text-white text-[11px] font-semibold transition-colors">
                          <MessageCircle className="h-3 w-3 fill-white" /> Order
                        </a>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="h-10 px-6 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors"
                >
                  Load more ({filtered.length - paginated.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reviews */}
      <div className="h-2 bg-muted/60 border-y border-border" />
      <div className="px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> Reviews
            <span className="text-sm font-normal text-muted-foreground">({creator.stats.reviewCount})</span>
          </h2>
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-sm">{creator.stats.avgRating}</p>
            <StarRow rating={5} small />
          </div>
        </div>
        <div className="space-y-3">
          {mockStorefrontReviews.map(review => (
            <div key={review.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center text-xs font-bold text-brand-purple flex-shrink-0">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{review.name}</p>
                    <p className="text-[10px] text-muted-foreground">{review.date}</p>
                  </div>
                </div>
                <StarRow rating={review.rating} small />
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
              <p className="mt-2 text-[10px] text-brand-purple/70 font-medium">Purchased: {review.productName}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-20 p-4 bg-background/90 backdrop-blur-sm border-t border-border lg:hidden">
        <a href={buildStoreWhatsAppUrl(creator.whatsapp, creator.storeName)} target="_blank" rel="noopener noreferrer">
          <Button variant="whatsapp" size="lg" className="w-full gap-2">
            <MessageCircle className="h-5 w-5 fill-white" /> Order from {creator.storeName}
          </Button>
        </a>
      </div>

      {/* Quick view modal */}
      <AnimatePresence>
        {quickView && (
          <QuickViewModal
            product={quickView}
            handle={handle}
            onClose={() => setQuickView(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
