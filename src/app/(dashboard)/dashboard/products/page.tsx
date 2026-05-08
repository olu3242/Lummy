"use client"

import * as React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  MessageCircle,
  Eye,
  ShoppingBag,
  TrendingUp,
  Edit,
  Trash2,
  ToggleLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { mockProducts, type DashboardProduct } from "@/data/mock/dashboard"
import { cn } from "@/lib/utils"

const statusConfig = {
  active:   { label: "Active",    className: "bg-brand-green/10 text-brand-green border-brand-green/20" },
  draft:    { label: "Draft",     className: "bg-muted text-muted-foreground border-border" },
  sold_out: { label: "Sold Out",  className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
}

const filters = ["All", "Active", "Draft", "Sold Out"]

function ProductCard({ product, index }: { product: DashboardProduct; index: number }) {
  const status = statusConfig[product.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:shadow-brand-sm transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Product image */}
      <div className="relative h-44 overflow-hidden bg-muted">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm", status.className)}>
            {status.label}
          </span>
        </div>

        {/* WhatsApp enabled */}
        {product.whatsappEnabled && (
          <div className="absolute top-3 right-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366]/20 border border-[#25D366]/30 backdrop-blur-sm">
              <MessageCircle className="w-3 h-3 text-[#25D366]" />
            </div>
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold hover:bg-white/20 transition-colors">
            <Edit className="w-3 h-3" /> Edit
          </button>
          <button className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-red-500/30 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Product info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{product.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
          </div>
          <p className="font-display font-bold text-sm text-brand-purple flex-shrink-0">
            ₦{product.price.toLocaleString()}
          </p>
        </div>

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-3 pt-3 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" />
            <span className="font-semibold text-foreground">{product.sales}</span>
            <span>sales</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span className="font-semibold text-foreground">{product.views.toLocaleString()}</span>
            <span>views</span>
          </div>
          <div className="ml-auto flex items-center gap-1 text-brand-green">
            <TrendingUp className="w-3 h-3" />
            <span className="font-semibold">₦{(product.revenue / 1000).toFixed(0)}k</span>
          </div>
        </div>

        {/* Stock */}
        {product.stock !== null && (
          <p className="mt-2 text-[10px] text-muted-foreground/60">
            {product.stock === 0 ? "No stock" : `${product.stock} in stock`}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default function ProductsPage() {
  const [search, setSearch] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState("All")

  const filtered = mockProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      activeFilter === "All" ||
      (activeFilter === "Active" && p.status === "active") ||
      (activeFilter === "Draft" && p.status === "draft") ||
      (activeFilter === "Sold Out" && p.status === "sold_out")
    return matchSearch && matchFilter
  })

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {mockProducts.filter((p) => p.status === "active").length} active · {mockProducts.length} total
          </p>
        </div>
        <Button size="sm" className="gap-2 w-fit">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 rounded-xl bg-muted p-1 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeFilter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 sm:max-w-xs">
          <Input
            placeholder="Search products…"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <Filter className="h-3.5 w-3.5" />
          Sort
        </Button>
      </div>

      {/* Products grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No products found</p>
          <p className="text-sm mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
