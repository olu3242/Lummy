"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MessageCircle, Eye, Star, ShoppingBag, X, ArrowRight } from "lucide-react"
import type { SectionProps, ProductGridSettings, StorefrontCreator } from "../schema/types"
import { buildWhatsAppUrl } from "@/data/mock/storefront"
import { getButtonRadius, getCardRadius, getCardShadow, accentWithAlpha } from "../themes/utils"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/globalization"

function QuickViewModal({
  product,
  creator,
  theme,
  onClose,
}: {
  product: StorefrontCreator["publicProducts"][number]
  creator: StorefrontCreator
  theme: import("../schema/types").ThemeTokens
  onClose: () => void
}) {
  const firstName = creator.name.split(" ")[0]
  const formattedPrice = formatMoney(product.price, product.currency)
  const whatsappUrl = buildWhatsAppUrl(creator.whatsapp, product.name, formattedPrice, firstName)
  const outOfStock = product.stock === 0
  const btnRadius = getButtonRadius(theme)

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-border bg-card overflow-hidden"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
          {outOfStock && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <span className="font-bold text-lg px-4 py-2 rounded-2xl bg-background border border-border shadow">Sold Out</span>
            </div>
          )}
          <button onClick={onClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60 mb-1">{product.category}</p>
              <h2 className="font-bold text-lg leading-snug">{product.name}</h2>
            </div>
            <p className="font-bold text-lg flex-shrink-0" style={{ color: theme.accent }}>
              {formattedPrice}
            </p>
          </div>
          <p className="text-sm opacity-70 leading-relaxed line-clamp-3">{product.description}</p>
          <div className="flex items-center gap-4 text-xs opacity-60 py-2 border-y border-border">
            <span className="flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" style={{ color: theme.accent }} /><strong>{product.sales}</strong> sold</span>
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /><strong>{product.views.toLocaleString()}</strong> views</span>
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /><strong>4.9</strong></span>
          </div>
          <div className="flex gap-2">
            {outOfStock ? (
              <div className="flex-1 flex items-center justify-center h-11 rounded-2xl border-2 border-border text-sm font-semibold opacity-50">
                Currently sold out
              </div>
            ) : (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <button
                  className="w-full h-11 flex items-center justify-center gap-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#25D366", borderRadius: btnRadius }}
                >
                  <MessageCircle className="h-4 w-4 fill-white" /> Order via WhatsApp
                </button>
              </a>
            )}
            <Link href={`/${creator.handle}/${product.id}`} onClick={onClose}
              className="flex h-11 items-center gap-1.5 px-4 rounded-2xl border border-border text-xs font-semibold hover:bg-accent transition-colors flex-shrink-0">
              Details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function ProductGridSection({ section, theme, creator }: SectionProps) {
  const s = section.settings as unknown as ProductGridSettings
  const [activeCategory, setActiveCategory] = React.useState("All")
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [quickView, setQuickView] = React.useState<StorefrontCreator["publicProducts"][number] | null>(null)
  const PAGE_SIZE = 6

  const firstName = creator.name.split(" ")[0]
  const cardRadius = getCardRadius(theme)
  const cardShadow = getCardShadow(theme)
  const btnRadius = getButtonRadius(theme)

  const cols =
    theme.layout === "grid-2" ? "grid-cols-2"
    : theme.layout === "list" ? "grid-cols-1"
    : "grid-cols-2 sm:grid-cols-3"

  const filtered = creator.publicProducts
    .slice(0, s.maxProducts ?? 12)
    .filter(p => {
      const matchCat = activeCategory === "All" || p.category === activeCategory
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })

  const paginated = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = paginated.length < filtered.length

  React.useEffect(() => { setPage(1) }, [activeCategory, search])

  return (
    <>
      <div className="px-4 pt-5 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" style={{ color: theme.accent }} />
            {s.title || "Products"}
          </h2>
          <p className="text-xs opacity-50">{filtered.length} available</p>
        </div>

        {s.showSearch && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full h-9 pl-9 pr-4 border border-border bg-background text-sm placeholder:opacity-40 focus:outline-none focus:ring-2 transition-shadow"
              style={{ borderRadius: cardRadius, boxShadow: "none" }}
            />
          </div>
        )}

        {s.showFilter && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
            {creator.categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold border transition-all"
                style={
                  activeCategory === cat
                    ? { backgroundColor: theme.accent, color: theme.accentFg, borderColor: theme.accent, borderRadius: btnRadius }
                    : { borderColor: "var(--border)", color: "inherit", opacity: 0.6, borderRadius: btnRadius }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="py-16 text-center opacity-40">
            <Search className="h-8 w-8 mx-auto mb-3" />
            <p className="text-sm font-semibold">No products found</p>
          </div>
        ) : (
          <>
            <div className={cn("grid gap-3", cols)}>
              {paginated.map((product, i) => {
                const formattedPrice = formatMoney(product.price, product.currency)
                const whatsappUrl = buildWhatsAppUrl(creator.whatsapp, product.name, formattedPrice, firstName)
                const outOfStock = product.stock === 0
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className={cn("group border border-border bg-card overflow-hidden", outOfStock && "opacity-60")}
                    style={{ borderRadius: cardRadius, boxShadow: cardShadow }}
                  >
                    <div className="relative">
                      <Link href={`/${creator.handle}/${product.id}`}>
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          <Image src={product.image} alt={product.name} fill className={cn("object-cover transition-transform duration-300", !outOfStock && "group-hover:scale-105")} unoptimized />
                          {outOfStock && (
                            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-background border border-border">Sold out</span>
                            </div>
                          )}
                          {s.showStock && !outOfStock && product.stock !== null && product.stock <= 5 && (
                            <div className="absolute bottom-2 left-2">
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white">
                                Only {product.stock} left
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                      {!outOfStock && (
                        <button
                          onClick={() => setQuickView(product)}
                          className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 h-7 rounded-lg bg-background/90 backdrop-blur-sm border border-border text-[10px] font-semibold transition-all"
                        >
                          <Eye className="h-3 w-3" /> Quick view
                        </button>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold leading-snug line-clamp-2 mb-1">{product.name}</p>
                      <p className="font-bold text-sm" style={{ color: theme.accent }}>{formattedPrice}</p>
                      {outOfStock ? (
                        <div className="mt-2.5 flex items-center justify-center w-full h-8 border border-border text-xs opacity-50 font-semibold" style={{ borderRadius: btnRadius }}>
                          Out of stock
                        </div>
                      ) : (
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                          className="mt-2.5 flex items-center justify-center gap-1.5 w-full h-8 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: "#25D366", borderRadius: btnRadius }}
                        >
                          <MessageCircle className="h-3 w-3 fill-white" /> Order
                        </a>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="h-10 px-6 border border-border text-sm font-semibold hover:bg-accent transition-colors"
                  style={{ borderRadius: getButtonRadius(theme) }}
                >
                  Load more ({filtered.length - paginated.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {quickView && (
          <QuickViewModal
            product={quickView}
            creator={creator}
            theme={theme}
            onClose={() => setQuickView(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
