"use client"

import * as React from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
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
  ImagePlus,
  CheckCheck,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet"
import { mockProducts, type DashboardProduct } from "@/data/mock/dashboard"
import { cn } from "@/lib/utils"

const statusConfig = {
  active:   { label: "Active",    className: "bg-brand-green/10 text-brand-green border-brand-green/20" },
  draft:    { label: "Draft",     className: "bg-muted text-muted-foreground border-border" },
  sold_out: { label: "Sold Out",  className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
}

const filters = ["All", "Active", "Draft", "Sold Out"]

const CATEGORIES = ["Clothing", "Jewellery", "Accessories", "Beauty", "Footwear", "Food", "Art", "Digital", "Services", "Other"]

interface ProductFormState {
  name: string
  description: string
  price: string
  stock: string
  category: string
  status: "active" | "draft" | "sold_out"
  imageUrl: string
  whatsappEnabled: boolean
}

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "Clothing",
  status: "active",
  imageUrl: "",
  whatsappEnabled: true,
}

function productToForm(p: DashboardProduct): ProductFormState {
  return {
    name: p.name,
    description: p.description,
    price: String(p.price),
    stock: p.stock !== null ? String(p.stock) : "",
    category: p.category,
    status: p.status,
    imageUrl: p.image,
    whatsappEnabled: p.whatsappEnabled,
  }
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold mb-1.5">
      {children}{required && <span className="text-brand-coral ml-0.5">*</span>}
    </label>
  )
}

function ProductDrawer({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: DashboardProduct | null
}) {
  const [form, setForm] = React.useState<ProductFormState>(emptyForm)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    setForm(editing ? productToForm(editing) : emptyForm)
    setSaved(false)
  }, [editing, open])

  const set = (key: keyof ProductFormState, val: ProductFormState[keyof ProductFormState]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 1200)
  }

  const inputCls = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30"

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit product" : "Add new product"}</SheetTitle>
          <SheetDescription>
            {editing ? `Editing "${editing.name}"` : "Fill in the details below to list a new product."}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          {/* Image preview + URL */}
          <div>
            <FieldLabel>Product image</FieldLabel>
            <div className="relative rounded-2xl overflow-hidden bg-muted border border-border h-44 mb-2.5 flex items-center justify-center">
              {form.imageUrl ? (
                <Image src={form.imageUrl} alt="preview" fill className="object-cover" unoptimized />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImagePlus className="h-8 w-8 opacity-30" />
                  <span className="text-xs">Image preview</span>
                </div>
              )}
            </div>
            <input
              value={form.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="Paste image URL…"
              className={inputCls}
            />
          </div>

          {/* Name */}
          <div>
            <FieldLabel required>Product name</FieldLabel>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ankara Print Dress" className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe your product…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
            />
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Price (₦)</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                <input
                  value={form.price}
                  onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className={cn(inputCls, "pl-7")}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Stock quantity</FieldLabel>
              <input
                value={form.stock}
                onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))}
                placeholder="Unlimited"
                className={inputCls}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <FieldLabel>Category</FieldLabel>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={cn(inputCls, "cursor-pointer")}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <FieldLabel>Status</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {(["active", "draft", "sold_out"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => set("status", s)}
                  className={cn(
                    "h-9 rounded-xl border text-xs font-semibold capitalize transition-all",
                    form.status === s
                      ? s === "active" ? "bg-brand-green/10 border-brand-green/40 text-brand-green"
                        : s === "draft" ? "bg-muted border-border text-foreground"
                        : "bg-amber-500/10 border-amber-500/40 text-amber-500"
                      : "border-border text-muted-foreground hover:border-foreground/20"
                  )}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
              </div>
              <div>
                <p className="text-sm font-semibold">WhatsApp ordering</p>
                <p className="text-xs text-muted-foreground">Show "Order via WhatsApp" button</p>
              </div>
            </div>
            <button
              onClick={() => set("whatsappEnabled", !form.whatsappEnabled)}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                form.whatsappEnabled ? "bg-[#25D366]" : "bg-muted-foreground/30"
              )}
            >
              <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform", form.whatsappEnabled ? "translate-x-4" : "translate-x-0.5")} />
            </button>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button variant="outline" size="sm" className="h-9 text-xs flex-1" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-9 text-xs flex-1 gap-1.5" onClick={handleSave} disabled={!form.name || !form.price}>
            {saved ? <><CheckCheck className="h-3.5 w-3.5" />Saved!</> : editing ? "Save changes" : "Add product"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function ProductCard({
  product,
  index,
  onEdit,
}: {
  product: DashboardProduct
  index: number
  onEdit: (p: DashboardProduct) => void
}) {
  const status = statusConfig[product.status]
  const [menuOpen, setMenuOpen] = React.useState(false)

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

        {product.whatsappEnabled && (
          <div className="absolute top-3 right-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366]/20 border border-[#25D366]/30 backdrop-blur-sm">
              <MessageCircle className="w-3 h-3 text-[#25D366]" />
            </div>
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button
            onClick={() => onEdit(product)}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
          >
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
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<DashboardProduct | null>(null)

  const filtered = mockProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      activeFilter === "All" ||
      (activeFilter === "Active" && p.status === "active") ||
      (activeFilter === "Draft" && p.status === "draft") ||
      (activeFilter === "Sold Out" && p.status === "sold_out")
    return matchSearch && matchFilter
  })

  const openAdd = () => { setEditingProduct(null); setDrawerOpen(true) }
  const openEdit = (p: DashboardProduct) => { setEditingProduct(p); setDrawerOpen(true) }

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
        <Button size="sm" className="gap-2 w-fit" onClick={openAdd}>
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
            <ProductCard key={product.id} product={product} index={i} onEdit={openEdit} />
          ))}
        </div>
      )}

      <ProductDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} editing={editingProduct} />
    </div>
  )
}
