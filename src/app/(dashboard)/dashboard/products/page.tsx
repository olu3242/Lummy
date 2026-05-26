"use client"

import * as React from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Search, Filter, MessageCircle,
  Eye, ShoppingBag, TrendingUp, Edit, Trash2, ImagePlus,
  ToggleLeft, ToggleRight, X, CheckSquare, Square,
  Sparkles, Loader2, Copy, Download, LayoutGrid, List,
  ChevronDown, AlertTriangle, ArrowUpDown, Tag,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetBody, SheetFooter,
} from "@/components/ui/sheet"
import { mockProducts, type DashboardProduct } from "@/data/mock/dashboard"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// ─── Config ────────────────────────────────────────────────────────────────────

const statusConfig = {
  active:   { label: "Active",   className: "bg-brand-green/10 text-brand-green border-brand-green/20" },
  draft:    { label: "Draft",    className: "bg-muted text-muted-foreground border-border" },
  sold_out: { label: "Sold Out", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
}

const STATUS_FILTERS = ["All", "Active", "Draft", "Sold Out"]
const CATEGORIES = ["Clothing", "Jewellery", "Accessories", "Beauty", "Footwear", "Food", "Art", "Digital", "Services", "Other"]
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "One Size"]
const COLOR_OPTIONS = [
  { name: "Black",  hex: "#111111" }, { name: "White",  hex: "#F5F5F5" },
  { name: "Red",    hex: "#EF4444" }, { name: "Blue",   hex: "#3B82F6" },
  { name: "Green",  hex: "#22C55E" }, { name: "Yellow", hex: "#EAB308" },
  { name: "Pink",   hex: "#EC4899" }, { name: "Purple", hex: "#6C4EF3" },
  { name: "Brown",  hex: "#92400E" }, { name: "Orange", hex: "#F97316" },
]

type SortKey = "newest" | "price_desc" | "price_asc" | "sales_desc" | "stock_low"
type ViewMode = "grid" | "list"

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest",     label: "Newest first" },
  { key: "price_desc", label: "Price: high → low" },
  { key: "price_asc",  label: "Price: low → high" },
  { key: "sales_desc", label: "Most sales" },
  { key: "stock_low",  label: "Low stock first" },
]

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProductFormState {
  name: string; description: string; price: string; stock: string
  category: string; status: "active" | "draft" | "sold_out"; imageUrl: string; whatsappEnabled: boolean
  sizes: string[]; colors: string[]
}

const emptyForm: ProductFormState = {
  name: "", description: "", price: "", stock: "", category: "Clothing",
  status: "active", imageUrl: "", whatsappEnabled: true,
  sizes: [], colors: [],
}

// ─── Utils ─────────────────────────────────────────────────────────────────────

const AI_DESCRIPTIONS: Record<string, string> = {
  default:     "A beautifully crafted piece made with premium materials. Designed for comfort and style, this item is perfect for any occasion. Each piece is carefully quality-checked before shipping.",
  clothing:    "Elevate your wardrobe with this stunning piece. Crafted from high-quality fabric, it offers a flattering fit and timeless style. Available in multiple sizes — perfect for everyday wear or special occasions.",
  jewellery:   "Handcrafted with care, this exquisite jewellery piece adds elegance to any outfit. Made from premium materials with intricate detailing. A perfect gift or a luxurious treat for yourself.",
  accessories: "A must-have accessory that completes any look. Crafted with attention to detail and built to last. Stylish, functional, and versatile — the perfect finishing touch.",
  beauty:      "Transform your beauty routine with this premium product. Formulated with the finest ingredients to deliver visible results. Gentle on skin and packed with nourishing benefits.",
}

function productToForm(p: DashboardProduct): ProductFormState {
  return {
    name: p.name, description: p.description, price: String(p.price),
    stock: p.stock !== null ? String(p.stock) : "", category: p.category,
    status: p.status, imageUrl: p.image, whatsappEnabled: p.whatsappEnabled,
    sizes: [], colors: [],
  }
}

function sortProducts(products: DashboardProduct[], key: SortKey): DashboardProduct[] {
  const arr = [...products]
  switch (key) {
    case "price_desc": return arr.sort((a, b) => b.price - a.price)
    case "price_asc":  return arr.sort((a, b) => a.price - b.price)
    case "sales_desc": return arr.sort((a, b) => b.sales - a.sales)
    case "stock_low":  return arr.sort((a, b) => (a.stock ?? Infinity) - (b.stock ?? Infinity))
    default:           return arr
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold mb-1.5">
      {children}{required && <span className="text-brand-coral ml-0.5">*</span>}
    </label>
  )
}

function StatsRow({ products }: { products: DashboardProduct[] }) {
  const active = products.filter(p => p.status === "active").length
  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0)
  const lowStock = products.filter(p => p.stock !== null && p.stock > 0 && p.stock <= 5).length
  const totalViews = products.reduce((s, p) => s + p.views, 0)

  const stats = [
    { label: "Active products", value: active, icon: ShoppingBag, color: "text-brand-green", bg: "bg-brand-green/10", suffix: "" },
    { label: "Total revenue",   value: `₦${(totalRevenue / 1000).toFixed(0)}k`, icon: TrendingUp, color: "text-brand-purple", bg: "bg-brand-purple/10", suffix: "" },
    { label: "Total views",     value: totalViews.toLocaleString(), icon: Eye, color: "text-brand-coral", bg: "bg-brand-coral/10", suffix: "" },
    { label: "Low stock alerts", value: lowStock, icon: AlertTriangle, color: lowStock > 0 ? "text-amber-500" : "text-muted-foreground", bg: lowStock > 0 ? "bg-amber-500/10" : "bg-muted", suffix: "" },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-xl", s.bg)}>
              <s.icon className={cn("h-3.5 w-3.5", s.color)} />
            </div>
          </div>
          <p className={cn("font-display text-xl font-extrabold", s.color)}>{s.value}</p>
        </motion.div>
      ))}
    </div>
  )
}

function SortMenu({ current, onChange, onClose }: { current: SortKey; onChange: (k: SortKey) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      className="absolute top-full right-0 mt-1.5 z-30 w-48 rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
    >
      {SORT_OPTIONS.map(opt => (
        <button key={opt.key} onClick={() => { onChange(opt.key); onClose() }}
          className={cn(
            "w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-muted/60",
            current === opt.key ? "text-brand-purple bg-brand-purple/5" : "text-foreground"
          )}>
          {opt.label}
          {current === opt.key && <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />}
        </button>
      ))}
    </motion.div>
  )
}

function ProductRow({
  product, index, onEdit, onDuplicate, selected, onSelect,
}: {
  product: DashboardProduct; index: number; onEdit: (p: DashboardProduct) => void
  onDuplicate: (p: DashboardProduct) => void; selected: boolean; onSelect: (id: string) => void
}) {
  const status = statusConfig[product.status]
  const isLow = product.stock !== null && product.stock > 0 && product.stock <= 5

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl border bg-card transition-all hover:bg-muted/30",
        selected ? "border-brand-purple ring-1 ring-brand-purple/20" : "border-border"
      )}
    >
      <button onClick={() => onSelect(product.id)} className="flex-shrink-0">
        {selected
          ? <CheckSquare className="h-4 w-4 text-brand-purple" />
          : <Square className="h-4 w-4 text-muted-foreground" />}
      </button>

      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0">
        <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
      </div>

      <div className="flex-1 min-w-0">
        <Link href={`/dashboard/products/${product.id}`}
          className="text-sm font-semibold hover:text-brand-purple transition-colors truncate block">
          {product.name}
        </Link>
        <p className="text-[10px] text-muted-foreground">{product.category}</p>
      </div>

      <span className={cn("hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold flex-shrink-0", status.className)}>
        {status.label}
      </span>

      <p className="font-display font-bold text-sm text-brand-purple flex-shrink-0 w-24 text-right">
        ₦{product.price.toLocaleString()}
      </p>

      <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
        <span className="flex items-center gap-1">
          <ShoppingBag className="h-3 w-3" />
          <span className="font-semibold text-foreground">{product.sales}</span>
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          <span className="font-semibold text-foreground">{product.views.toLocaleString()}</span>
        </span>
      </div>

      {product.stock !== null ? (
        <span className={cn(
          "text-xs font-semibold flex-shrink-0 w-14 text-right",
          product.stock === 0 ? "text-red-500" : isLow ? "text-amber-500" : "text-muted-foreground"
        )}>
          {product.stock === 0 ? "Out" : `${product.stock} left`}
          {isLow && product.stock > 0 && " ⚠"}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground flex-shrink-0 w-14 text-right">∞</span>
      )}

      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button onClick={() => onEdit(product)}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <Edit className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDuplicate(product)}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

function ProductCard({
  product, index, onEdit, onDuplicate, selected, onSelect,
}: {
  product: DashboardProduct; index: number; onEdit: (p: DashboardProduct) => void
  onDuplicate: (p: DashboardProduct) => void; selected: boolean; onSelect: (id: string) => void
}) {
  const status = statusConfig[product.status]
  const isLow = product.stock !== null && product.stock > 0 && product.stock <= 5

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={cn(
        "group relative rounded-2xl border bg-card overflow-hidden hover:shadow-brand-sm transition-all duration-300 hover:-translate-y-0.5",
        selected ? "border-brand-purple ring-1 ring-brand-purple/30" : "border-border"
      )}
    >
      <button onClick={() => onSelect(product.id)}
        className="absolute top-2.5 left-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        {selected
          ? <CheckSquare className="h-5 w-5 text-brand-purple fill-brand-purple/10" />
          : <Square className="h-5 w-5 text-white drop-shadow" />}
      </button>
      {selected && (
        <button onClick={() => onSelect(product.id)} className="absolute top-2.5 left-2.5 z-10">
          <CheckSquare className="h-5 w-5 text-brand-purple fill-brand-purple/10" />
        </button>
      )}

      <div className="relative h-44 overflow-hidden bg-muted">
        <Image src={product.image} alt={product.name} fill
          className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm", status.className)}>
            {status.label}
          </span>
          {isLow && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 backdrop-blur-sm">
              <AlertTriangle className="h-2.5 w-2.5" /> Low
            </span>
          )}
        </div>

        {product.whatsappEnabled && (
          <div className="absolute top-3 right-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366]/20 border border-[#25D366]/30 backdrop-blur-sm">
              <MessageCircle className="w-3 h-3 text-[#25D366]" />
            </div>
          </div>
        )}

        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button onClick={() => onEdit(product)}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold hover:bg-white/20 transition-colors">
            <Edit className="w-3 h-3" /> Edit
          </button>
          <button onClick={e => { e.stopPropagation(); onDuplicate(product) }}
            className="flex items-center justify-center gap-1 h-8 px-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold hover:bg-white/20 transition-colors">
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/dashboard/products/${product.id}`} className="font-semibold text-sm truncate hover:text-brand-purple transition-colors block">{product.name}</Link>
            <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
          </div>
          <p className="font-display font-bold text-sm text-brand-purple flex-shrink-0">₦{product.price.toLocaleString()}</p>
        </div>

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
          </div>
          <div className="ml-auto flex items-center gap-1 text-brand-green">
            <TrendingUp className="w-3 h-3" />
            <span className="font-semibold">₦{(product.revenue / 1000).toFixed(0)}k</span>
          </div>
        </div>

        {product.stock !== null && (
          <p className={cn("mt-2 text-[10px]", product.stock === 0 ? "text-red-400 font-semibold" : isLow ? "text-amber-500 font-semibold" : "text-muted-foreground/60")}>
            {product.stock === 0 ? "No stock remaining" : `${product.stock} in stock`}
          </p>
        )}
      </div>
    </motion.div>
  )
}

function ProductDrawer({
  open, onClose, editing, onSaved,
}: {
  open: boolean; onClose: () => void; editing: DashboardProduct | null; onSaved: () => void
}) {
  const [form, setForm] = React.useState<ProductFormState>(emptyForm)
  const [saving, setSaving] = React.useState(false)
  const [aiGenerating, setAiGenerating] = React.useState(false)

  React.useEffect(() => {
    setForm(editing ? productToForm(editing) : emptyForm)
    setSaving(false)
    setAiGenerating(false)
  }, [editing, open])

  const set = (key: keyof ProductFormState, val: ProductFormState[keyof ProductFormState]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const toggleSize = (s: string) =>
    setForm(f => ({ ...f, sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s] }))

  const toggleColor = (c: string) =>
    setForm(f => ({ ...f, colors: f.colors.includes(c) ? f.colors.filter(x => x !== c) : [...f.colors, c] }))

  const generateDescription = () => {
    if (!form.name) { toast({ title: "Enter a product name first", variant: "default" }); return }
    setAiGenerating(true)
    const cat = form.category.toLowerCase()
    const base = AI_DESCRIPTIONS[cat] ?? AI_DESCRIPTIONS.default
    const full = `✨ ${form.name}\n\n${base}`
    let i = 0
    setForm(f => ({ ...f, description: "" }))
    const interval = setInterval(() => {
      i++
      setForm(f => ({ ...f, description: full.slice(0, i) }))
      if (i >= full.length) { clearInterval(interval); setAiGenerating(false) }
    }, 18)
  }

  const inputCls = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30"

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: "Name and price are required", variant: "default" })
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.name,
        description: form.description || undefined,
        price: Math.round(parseFloat(form.price) * 100), // kobo
        image_url: form.imageUrl || undefined,
        status: form.status,
      }
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("API error")
      onClose(); onSaved()
      toast({
        title: editing ? "Product updated" : "Product added",
        description: editing ? `"${form.name}" has been updated.` : `"${form.name}" is now live in your store.`,
        variant: "success",
      })
    } catch {
      toast({ title: "Failed to save product", description: "Please try again.", variant: "error" })
    } finally {
      setSaving(false)
    }
  }

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
            <input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="Paste image URL…" className={inputCls} />
          </div>

          <div>
            <FieldLabel required>Product name</FieldLabel>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Ankara Print Dress" className={inputCls} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold">Description</label>
              <button onClick={generateDescription} disabled={aiGenerating}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-purple hover:text-brand-purple/80 transition-colors disabled:opacity-60">
                {aiGenerating
                  ? <><Loader2 className="h-3 w-3 animate-spin" />Generating…</>
                  : <><Sparkles className="h-3 w-3" />Generate with AI</>}
              </button>
            </div>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Describe your product… or click Generate with AI ✨"
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30 leading-relaxed" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Price (₦)</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                <input value={form.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))}
                  placeholder="18000" className={cn(inputCls, "pl-7")} />
              </div>
            </div>
            <div>
              <FieldLabel>Stock qty</FieldLabel>
              <input value={form.stock} onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))}
                placeholder="∞ unlimited" className={inputCls} />
            </div>
          </div>

          <div>
            <FieldLabel>Category</FieldLabel>
            <select value={form.category} onChange={(e) => set("category", e.target.value)}
              className={cn(inputCls, "cursor-pointer")}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <FieldLabel>Sizes <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map(s => (
                <button key={s} onClick={() => toggleSize(s)}
                  className={cn(
                    "h-8 px-3 rounded-xl border text-xs font-semibold transition-all",
                    form.sizes.includes(s)
                      ? "bg-brand-purple text-white border-brand-purple"
                      : "border-border text-muted-foreground hover:border-brand-purple/30"
                  )}>{s}</button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Colours <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(c => (
                <button key={c.name} onClick={() => toggleColor(c.name)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all",
                    form.colors.includes(c.name) ? "border-brand-purple scale-110 ring-2 ring-brand-purple/30" : "border-border hover:border-brand-purple/30"
                  )}
                  style={{ backgroundColor: c.hex }} />
              ))}
            </div>
            {form.colors.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1.5">{form.colors.join(", ")}</p>
            )}
          </div>

          <div>
            <FieldLabel>Status</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {(["active", "draft", "sold_out"] as const).map((s) => (
                <button key={s} onClick={() => set("status", s)}
                  className={cn(
                    "h-9 rounded-xl border text-xs font-semibold capitalize transition-all",
                    form.status === s
                      ? s === "active" ? "bg-brand-green/10 border-brand-green/40 text-brand-green"
                        : s === "draft" ? "bg-muted border-border text-foreground"
                        : "bg-amber-500/10 border-amber-500/40 text-amber-500"
                      : "border-border text-muted-foreground hover:border-foreground/20"
                  )}>
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
              </div>
              <div>
                <p className="text-sm font-semibold">WhatsApp ordering</p>
                <p className="text-xs text-muted-foreground">Show &quot;Order via WhatsApp&quot; button</p>
              </div>
            </div>
            <button onClick={() => set("whatsappEnabled", !form.whatsappEnabled)}
              className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                form.whatsappEnabled ? "bg-[#25D366]" : "bg-muted-foreground/30")}>
              <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform",
                form.whatsappEnabled ? "translate-x-4" : "translate-x-0.5")} />
            </button>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button variant="outline" size="sm" className="h-9 text-xs flex-1" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-9 text-xs flex-1 gap-1.5" onClick={handleSave}
            disabled={!form.name || !form.price || saving}>
            {saving
              ? <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span>
              : editing ? "Save changes" : "Add product"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = React.useState<DashboardProduct[]>([])
  const [search, setSearch] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState("All")
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<DashboardProduct | null>(null)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = React.useState<SortKey>("newest")
  const [showSortMenu, setShowSortMenu] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")
  const [lowStockDismissed, setLowStockDismissed] = React.useState(false)

  const sortMenuRef = React.useRef<HTMLDivElement>(null)

  // Load real products from API on mount
  React.useEffect(() => {
    fetch("/api/products")
      .then(r => r.ok ? r.json() : null)
      .then((data: { products?: Array<{ id: string; title: string; description?: string; price: number; image_url?: string; status?: string; organization_id: string; created_at: string }> } | null) => {
        if (data?.products?.length) {
          setProducts(data.products.map(p => ({
            id: p.id,
            name: p.title,
            description: p.description ?? "",
            price: Math.round(p.price / 100), // kobo → Naira for display
            stock: null,
            category: "Other",
            status: (p.status ?? "active") as DashboardProduct["status"],
            image: p.image_url ?? "",
            imageUrl: p.image_url ?? "",
            whatsappEnabled: true,
            sizes: [],
            colors: [],
            sales: 0,
            views: 0,
            revenue: 0,
            createdAt: p.created_at?.split("T")[0] ?? "",
          })))
        }
      })
      .catch(() => { /* keep empty state */ })
  }, [])

  // Close sort menu on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false)
      }
    }
    if (showSortMenu) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showSortMenu])

  const lowStockProducts = products.filter(p => p.stock !== null && p.stock > 0 && p.stock <= 5)

  const filtered = sortProducts(
    products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchFilter =
        activeFilter === "All" ||
        (activeFilter === "Active" && p.status === "active") ||
        (activeFilter === "Draft" && p.status === "draft") ||
        (activeFilter === "Sold Out" && p.status === "sold_out")
      const matchCategory = !activeCategory || p.category === activeCategory
      return matchSearch && matchFilter && matchCategory
    }),
    sortKey
  )

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((p) => p.id)))
  }

  const clearSelection = () => setSelected(new Set())

  const bulkDelete = () => {
    const count = selected.size
    setProducts((prev) => prev.filter((p) => !selected.has(p.id)))
    clearSelection()
    toast({ title: `${count} product${count > 1 ? "s" : ""} deleted`, variant: "default" })
  }

  const bulkSetStatus = (status: "active" | "draft") => {
    const count = selected.size
    setProducts((prev) => prev.map((p) => selected.has(p.id) ? { ...p, status } : p))
    clearSelection()
    toast({ title: `${count} product${count > 1 ? "s" : ""} set to ${status}`, variant: "success" })
  }

  const openAdd = () => { setEditingProduct(null); setDrawerOpen(true) }
  const openEdit = (p: DashboardProduct) => { setEditingProduct(p); setDrawerOpen(true) }

  const duplicateProduct = (p: DashboardProduct) => {
    const copy: DashboardProduct = {
      ...p, id: `${p.id}-copy-${Date.now()}`, name: `Copy of ${p.name}`,
      status: "draft", sales: 0, views: 0, revenue: 0,
    }
    setProducts(prev => [copy, ...prev])
    toast({ title: "Product duplicated", description: `"${copy.name}" added as a draft.`, variant: "success" })
  }

  const exportCSV = () => {
    const header = ["Name", "Category", "Price (₦)", "Stock", "Status", "Sales", "Revenue (₦)"]
    const rows = products.map(p => [
      `"${p.name}"`, p.category, p.price, p.stock ?? "unlimited", p.status, p.sales, p.revenue,
    ].join(","))
    const csv = [header.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "lummy-products.csv"; a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Products exported" })
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* KPI stats */}
      <StatsRow products={products} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {products.filter((p) => p.status === "active").length} active · {products.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-background text-xs font-semibold hover:bg-accent transition-colors">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <Button size="sm" className="gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Low stock alert */}
      <AnimatePresence>
        {lowStockProducts.length > 0 && !lowStockDismissed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-500/25 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-amber-600 flex-1">
              {lowStockProducts.length} product{lowStockProducts.length > 1 ? "s" : ""} running low on stock —{" "}
              <span className="font-normal text-muted-foreground">{lowStockProducts.map(p => p.name).join(", ")}</span>
            </p>
            <button onClick={() => setLowStockDismissed(true)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters + search + sort + view */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 rounded-xl bg-muted p-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeFilter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 sm:max-w-xs">
          <Input placeholder="Search products…" icon={<Search className="h-4 w-4" />}
            value={search} onChange={(e) => setSearch(e.target.value)} className="h-9" />
        </div>
        <div className="flex gap-2 items-center">
          {/* Sort */}
          <div className="relative" ref={sortMenuRef}>
            <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => setShowSortMenu(v => !v)}>
              <ArrowUpDown className="h-3.5 w-3.5" />
              {SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? "Sort"}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
            <AnimatePresence>
              {showSortMenu && <SortMenu current={sortKey} onChange={setSortKey} onClose={() => setShowSortMenu(false)} />}
            </AnimatePresence>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-xl border border-border p-0.5 bg-muted/30">
            <button onClick={() => setViewMode("grid")}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setViewMode("list")}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
            !activeCategory ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"
          )}>
          <Tag className="h-3 w-3" /> All categories
        </button>
        {CATEGORIES.map(cat => {
          const count = products.filter(p => p.category === cat).length
          if (count === 0) return null
          return (
            <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                activeCategory === cat
                  ? "bg-brand-purple/10 border-brand-purple/30 text-brand-purple"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}>
              {cat}
              <span className="text-[9px] opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 p-3 rounded-2xl border border-brand-purple/30 bg-brand-purple/5">
            <button onClick={selectAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-purple">
              <CheckSquare className="h-4 w-4" /> {selected.size} selected
            </button>
            <div className="w-px h-4 bg-brand-purple/20 mx-1" />
            <button onClick={() => bulkSetStatus("active")}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-colors">
              <ToggleRight className="h-3.5 w-3.5" /> Activate
            </button>
            <button onClick={() => bulkSetStatus("draft")}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
              <ToggleLeft className="h-3.5 w-3.5" /> Set draft
            </button>
            <button onClick={bulkDelete}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-brand-coral/10 text-brand-coral hover:bg-brand-coral/20 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
            <button onClick={clearSelection} className="ml-auto p-1 rounded-lg hover:bg-brand-purple/10 text-muted-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No products found</p>
          <p className="text-sm mt-1">Try a different search or filter</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} onEdit={openEdit}
              onDuplicate={duplicateProduct} selected={selected.has(product.id)} onSelect={toggleSelect} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* List header */}
          <div className="hidden lg:grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="w-4" />
            <span>Product</span>
            <span className="w-16">Status</span>
            <span className="w-24 text-right">Price</span>
            <span className="w-28">Sales / Views</span>
            <span className="w-14 text-right">Stock</span>
            <span className="w-16" />
          </div>
          {filtered.map((product, i) => (
            <ProductRow key={product.id} product={product} index={i} onEdit={openEdit}
              onDuplicate={duplicateProduct} selected={selected.has(product.id)} onSelect={toggleSelect} />
          ))}
        </div>
      )}

      <ProductDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        editing={editingProduct} onSaved={() => {
          fetch("/api/products")
            .then(r => r.ok ? r.json() : null)
            .then((data: { products?: Array<{ id: string; title: string; description?: string; price: number; image_url?: string; status?: string; organization_id: string; created_at: string }> } | null) => {
              if (data?.products) {
                setProducts(data.products.map(p => ({
                  id: p.id, name: p.title, description: p.description ?? "",
                  price: Math.round(p.price / 100), stock: null, category: "Other", // kobo → Naira
                  status: (p.status ?? "active") as DashboardProduct["status"],
                  image: p.image_url ?? "", imageUrl: p.image_url ?? "",
                  whatsappEnabled: true, sizes: [], colors: [],
                  sales: 0, views: 0, revenue: 0,
                  createdAt: p.created_at?.split("T")[0] ?? "",
                })))
              }
            })
            .catch(() => {})
        }} />
    </div>
  )
}
