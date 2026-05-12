"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
  Plus,
  X,
  ChevronLeft,
  Search,
  Tag,
  Eye,
  BarChart2,
  ShoppingBag,
  CheckCircle2,
  Circle,
  MessageCircle,
  Copy,
  Pencil,
  Trash2,
  ArrowRight,
  Layers,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { mockProducts, DashboardProduct } from "@/data/mock/dashboard"
import { toast } from "@/hooks/use-toast"

const BUNDLES_KEY = "lummy_product_bundles"

interface Bundle {
  id: string
  name: string
  description: string
  productIds: string[]
  discountType: "percent" | "fixed"
  discountValue: number
  enabled: boolean
  createdAt: string
  views: number
  sales: number
}

const DEFAULT_BUNDLES: Bundle[] = [
  {
    id: "b1",
    name: "Style Starter Pack",
    description: "Everything you need to complete your look",
    productIds: ["p1", "p2", "p3"],
    discountType: "percent",
    discountValue: 15,
    enabled: true,
    createdAt: "2025-04-10",
    views: 342,
    sales: 28,
  },
  {
    id: "b2",
    name: "Skincare Essentials",
    description: "Daily routine in one bundle — cleanse, tone, moisturise",
    productIds: ["p4", "p5"],
    discountType: "fixed",
    discountValue: 3000,
    enabled: true,
    createdAt: "2025-04-22",
    views: 189,
    sales: 14,
  },
  {
    id: "b3",
    name: "Gift Set Deluxe",
    description: "Perfect gifting combo for special occasions",
    productIds: ["p2", "p6"],
    discountType: "percent",
    discountValue: 10,
    enabled: false,
    createdAt: "2025-05-01",
    views: 56,
    sales: 3,
  },
]

function loadBundles(): Bundle[] {
  if (typeof window === "undefined") return DEFAULT_BUNDLES
  try {
    const raw = localStorage.getItem(BUNDLES_KEY)
    if (raw) return JSON.parse(raw) as Bundle[]
  } catch {}
  return DEFAULT_BUNDLES
}

function saveBundles(bundles: Bundle[]) {
  try {
    localStorage.setItem(BUNDLES_KEY, JSON.stringify(bundles))
  } catch {}
}

function calcBundlePrice(productIds: string[], discountType: "percent" | "fixed", discountValue: number) {
  const products = productIds.map(id => mockProducts.find(p => p.id === id)).filter(Boolean) as DashboardProduct[]
  const original = products.reduce((sum, p) => sum + p.price, 0)
  const discounted = discountType === "percent"
    ? original * (1 - discountValue / 100)
    : Math.max(0, original - discountValue)
  const savings = original - discounted
  return { original, discounted, savings }
}

function formatPrice(n: number) {
  return "₦" + n.toLocaleString("en-NG")
}

// ── Product Picker Modal ──────────────────────────────────────────────────────
interface ProductPickerProps {
  selected: string[]
  onChange: (ids: string[]) => void
  onClose: () => void
}

function ProductPicker({ selected, onChange, onClose }: ProductPickerProps) {
  const [query, setQuery] = React.useState("")
  const [draft, setDraft] = React.useState<string[]>(selected)

  const filtered = mockProducts.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  )

  const toggle = (id: string) => {
    setDraft(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ maxHeight: "80vh" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-bold text-sm">Select Products</p>
            <p className="text-xs text-muted-foreground">{draft.length} selected</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products…"
              className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="overflow-y-auto px-4 pb-4 space-y-1.5" style={{ maxHeight: "calc(80vh - 160px)" }}>
          {filtered.map(product => {
            const picked = draft.includes(product.id)
            return (
              <button
                key={product.id}
                onClick={() => toggle(product.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left",
                  picked ? "border-brand-purple/40 bg-brand-purple/5" : "border-border hover:border-brand-purple/20 hover:bg-accent/50"
                )}
              >
                <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{product.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatPrice(product.price)} · {product.category}</p>
                </div>
                <div className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  picked ? "border-brand-purple bg-brand-purple" : "border-muted-foreground/30"
                )}>
                  {picked && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                </div>
              </button>
            )
          })}
        </div>

        <div className="px-4 py-3 border-t border-border flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold hover:bg-accent transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onChange(draft); onClose() }}
            disabled={draft.length < 2}
            className="flex-1 rounded-xl bg-brand-purple py-2 text-xs font-semibold text-white hover:bg-brand-purple/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm ({draft.length})
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Bundle Form Modal ─────────────────────────────────────────────────────────
interface BundleFormProps {
  initial?: Partial<Bundle>
  onSave: (data: Omit<Bundle, "id" | "createdAt" | "views" | "sales" | "enabled">) => void
  onClose: () => void
}

function BundleForm({ initial, onSave, onClose }: BundleFormProps) {
  const [name, setName] = React.useState(initial?.name ?? "")
  const [description, setDescription] = React.useState(initial?.description ?? "")
  const [selectedIds, setSelectedIds] = React.useState<string[]>(initial?.productIds ?? [])
  const [discountType, setDiscountType] = React.useState<"percent" | "fixed">(initial?.discountType ?? "percent")
  const [discountValue, setDiscountValue] = React.useState(initial?.discountValue?.toString() ?? "10")
  const [showPicker, setShowPicker] = React.useState(false)

  const selectedProducts = selectedIds.map(id => mockProducts.find(p => p.id === id)).filter(Boolean) as DashboardProduct[]
  const { original, discounted, savings } = selectedIds.length >= 2
    ? calcBundlePrice(selectedIds, discountType, parseFloat(discountValue) || 0)
    : { original: 0, discounted: 0, savings: 0 }

  const valid = name.trim().length > 0 && selectedIds.length >= 2 && (parseFloat(discountValue) || 0) > 0

  const handleSave = () => {
    if (!valid) return
    onSave({ name: name.trim(), description: description.trim(), productIds: selectedIds, discountType, discountValue: parseFloat(discountValue) })
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="w-full sm:max-w-lg bg-card border border-border rounded-t-3xl sm:rounded-2xl overflow-hidden"
          style={{ maxHeight: "90vh" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <p className="font-bold text-sm">{initial?.id ? "Edit Bundle" : "Create Bundle"}</p>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: "calc(90vh - 140px)" }}>
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Bundle Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Style Starter Pack"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-purple/50 transition-colors"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly describe what's in this bundle…"
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-purple/50 transition-colors resize-none"
              />
            </div>

            {/* Products */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">Products</label>
                <span className="text-[10px] text-muted-foreground">Min. 2 required</span>
              </div>
              {selectedProducts.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedProducts.map(p => (
                    <div key={p.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-background/50 p-2">
                      <div className="relative h-8 w-8 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={p.image} alt={p.name} fill className="object-cover" unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatPrice(p.price)}</p>
                      </div>
                      <button onClick={() => setSelectedIds(prev => prev.filter(id => id !== p.id))} className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowPicker(true)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-purple/30 py-2 text-xs text-brand-purple hover:bg-brand-purple/5 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add more products
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPicker(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-xs text-muted-foreground hover:border-brand-purple/30 hover:text-brand-purple hover:bg-brand-purple/3 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Select products to bundle
                </button>
              )}
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <label className="text-xs font-semibold">Bundle Discount</label>
              <div className="flex gap-2">
                <div className="flex rounded-xl border border-border overflow-hidden">
                  {(["percent", "fixed"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setDiscountType(type)}
                      className={cn(
                        "px-3 py-2 text-xs font-semibold transition-all",
                        discountType === type ? "bg-brand-purple text-white" : "text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {type === "percent" ? "%" : "₦"}
                    </button>
                  ))}
                </div>
                <div className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                  <input
                    type="number"
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value)}
                    min={1}
                    max={discountType === "percent" ? 90 : undefined}
                    className="flex-1 text-sm bg-transparent outline-none"
                    placeholder={discountType === "percent" ? "10" : "2000"}
                  />
                  <span className="text-xs text-muted-foreground">{discountType === "percent" ? "% off" : "₦ off"}</span>
                </div>
              </div>
            </div>

            {/* Price preview */}
            {selectedIds.length >= 2 && savings > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-brand-green/20 bg-brand-green/5 p-4"
              >
                <p className="text-xs font-semibold text-brand-green mb-2">Price Preview</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground line-through">{formatPrice(original)}</p>
                    <p className="text-xl font-bold">{formatPrice(discounted)}</p>
                  </div>
                  <div className="rounded-xl bg-brand-green/15 px-3 py-1.5 text-center">
                    <p className="text-xs font-bold text-brand-green">Save {formatPrice(savings)}</p>
                    <p className="text-[10px] text-brand-green/70">
                      {discountType === "percent" ? `${discountValue}% off` : `flat discount`}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-border flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold hover:bg-accent transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!valid}
              className="flex-1 rounded-xl bg-brand-purple py-2.5 text-xs font-semibold text-white hover:bg-brand-purple/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {initial?.id ? "Save Changes" : "Create Bundle"}
            </button>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showPicker && (
          <ProductPicker
            selected={selectedIds}
            onChange={setSelectedIds}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ── Bundle Card ───────────────────────────────────────────────────────────────
interface BundleCardProps {
  bundle: Bundle
  onToggle: (id: string) => void
  onEdit: (bundle: Bundle) => void
  onDelete: (id: string) => void
  onShare: (bundle: Bundle) => void
}

function BundleCard({ bundle, onToggle, onEdit, onDelete, onShare }: BundleCardProps) {
  const products = bundle.productIds.map(id => mockProducts.find(p => p.id === id)).filter(Boolean) as DashboardProduct[]
  const { original, discounted, savings } = calcBundlePrice(bundle.productIds, bundle.discountType, bundle.discountValue)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        "rounded-2xl border bg-card p-4 space-y-3 transition-all",
        bundle.enabled ? "border-border" : "border-border/40 opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold truncate">{bundle.name}</p>
            {bundle.discountType === "percent" ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-coral/15 text-brand-coral">
                {bundle.discountValue}% OFF
              </span>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-green/15 text-brand-green">
                Save {formatPrice(savings)}
              </span>
            )}
            {!bundle.enabled && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                Disabled
              </span>
            )}
          </div>
          {bundle.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{bundle.description}</p>
          )}
        </div>
        {/* Toggle */}
        <button
          onClick={() => onToggle(bundle.id)}
          className={cn(
            "relative flex-shrink-0 h-5 w-9 rounded-full transition-all duration-200",
            bundle.enabled ? "bg-brand-purple" : "bg-muted"
          )}
        >
          <span className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
            bundle.enabled ? "translate-x-4" : "translate-x-0.5"
          )} />
        </button>
      </div>

      {/* Product images stack */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {products.slice(0, 4).map((p, i) => (
            <div
              key={p.id}
              className="relative h-8 w-8 rounded-lg border-2 border-card overflow-hidden"
              style={{ zIndex: 4 - i }}
            >
              <Image src={p.image} alt={p.name} fill className="object-cover" unoptimized />
            </div>
          ))}
          {products.length > 4 && (
            <div className="relative h-8 w-8 rounded-lg border-2 border-card bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
              +{products.length - 4}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground">{products.map(p => p.name).join(", ")}</p>
        </div>
      </div>

      {/* Pricing */}
      <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2">
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Bundle Price</p>
          <p className="text-sm font-bold">{formatPrice(discounted)}</p>
        </div>
        <div className="h-6 w-px bg-border" />
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Original</p>
          <p className="text-xs line-through text-muted-foreground">{formatPrice(original)}</p>
        </div>
        <div className="h-6 w-px bg-border" />
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Savings</p>
          <p className="text-xs font-semibold text-brand-green">{formatPrice(savings)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-muted/40 px-3 py-2">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Views</p>
          <p className="text-sm font-bold">{bundle.views.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-2">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Sales</p>
          <p className="text-sm font-bold">{bundle.sales}</p>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-2">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Revenue</p>
          <p className="text-sm font-bold">{formatPrice(bundle.sales * discounted)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={() => onShare(bundle)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366]/10 text-[#25D366] py-2 text-xs font-semibold hover:bg-[#25D366]/20 transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Share
        </button>
        <button
          onClick={() => onEdit(bundle)}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-accent transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          onClick={() => onDelete(bundle.id)}
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-brand-coral hover:border-brand-coral/30 hover:bg-brand-coral/5 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BundlesPage() {
  const [bundles, setBundles] = React.useState<Bundle[]>([])
  const [showForm, setShowForm] = React.useState(false)
  const [editingBundle, setEditingBundle] = React.useState<Bundle | null>(null)
  const [filter, setFilter] = React.useState<"all" | "active" | "disabled">("all")
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null)

  // Load from localStorage after mount
  React.useEffect(() => { setBundles(loadBundles()) }, [])

  const persist = (next: Bundle[]) => {
    setBundles(next)
    saveBundles(next)
  }

  const handleCreate = (data: Omit<Bundle, "id" | "createdAt" | "views" | "sales" | "enabled">) => {
    const next = [...bundles, {
      ...data,
      id: "b" + Date.now(),
      createdAt: new Date().toISOString().split("T")[0],
      views: 0,
      sales: 0,
      enabled: true,
    }]
    persist(next)
    setShowForm(false)
    toast({ title: "Bundle created", description: `"${data.name}" is now live on your store.` })
  }

  const handleUpdate = (data: Omit<Bundle, "id" | "createdAt" | "views" | "sales" | "enabled">) => {
    if (!editingBundle) return
    const next = bundles.map(b => b.id === editingBundle.id ? { ...b, ...data } : b)
    persist(next)
    setEditingBundle(null)
    toast({ title: "Bundle updated" })
  }

  const handleToggle = (id: string) => {
    const next = bundles.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b)
    persist(next)
    const bundle = next.find(b => b.id === id)!
    toast({ title: bundle.enabled ? "Bundle enabled" : "Bundle disabled" })
  }

  const handleDelete = (id: string) => {
    const bundle = bundles.find(b => b.id === id)
    const next = bundles.filter(b => b.id !== id)
    persist(next)
    setDeleteConfirmId(null)
    toast({ title: "Bundle deleted", description: `"${bundle?.name}" has been removed.` })
  }

  const handleShare = (bundle: Bundle) => {
    const { discounted, savings } = calcBundlePrice(bundle.productIds, bundle.discountType, bundle.discountValue)
    const products = bundle.productIds.map(id => mockProducts.find(p => p.id === id)).filter(Boolean) as DashboardProduct[]
    const productList = products.map(p => `• ${p.name}`).join("\n")
    const msg = `🛍️ *${bundle.name}* — Bundle Deal!\n\n${productList}\n\n✨ Save ${formatPrice(savings)}!\nBundle Price: *${formatPrice(discounted)}*\n\n👇 Order now on my store`
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(waUrl, "_blank")
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://lummy.co/store/bundles").then(() => {
      toast({ title: "Link copied!" })
    })
  }

  const filtered = bundles.filter(b =>
    filter === "all" ? true : filter === "active" ? b.enabled : !b.enabled
  )

  const activeBundles = bundles.filter(b => b.enabled).length
  const totalSales = bundles.reduce((s, b) => s + b.sales, 0)
  const totalRevenue = bundles.reduce((s, b) => {
    const { discounted } = calcBundlePrice(b.productIds, b.discountType, b.discountValue)
    return s + b.sales * discounted
  }, 0)

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/products" className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold">Product Bundles</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-8">Group products into special-price bundles to boost average order value</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-purple px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-purple/90 transition-colors flex-shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New Bundle
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Bundles", value: bundles.length, icon: Layers, color: "text-brand-purple", bg: "bg-brand-purple/10" },
          { label: "Active", value: activeBundles, icon: CheckCircle2, color: "text-brand-green", bg: "bg-brand-green/10" },
          { label: "Total Sales", value: totalSales, icon: ShoppingBag, color: "text-brand-coral", bg: "bg-brand-coral/10" },
          { label: "Bundle Revenue", value: formatPrice(totalRevenue), icon: Tag, color: "text-brand-indigo", bg: "bg-brand-indigo/10" },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <div className={cn("rounded-xl p-2", stat.bg)}>
                <Icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                <p className="text-base font-bold">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tip banner */}
      <div className="flex items-start gap-3 rounded-2xl bg-brand-purple/8 border border-brand-purple/15 px-4 py-3">
        <Sparkles className="h-4 w-4 text-brand-purple flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-brand-purple">Bundles drive 30–50% higher order values</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Pair complementary products and offer a meaningful discount. Share via WhatsApp to amplify reach.</p>
        </div>
      </div>

      {/* Filter + actions bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          {(["all", "active", "disabled"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                filter === f ? "bg-brand-purple text-white" : "text-muted-foreground hover:bg-accent"
              )}
            >
              {f === "all" ? `All (${bundles.length})` : f === "active" ? `Active (${activeBundles})` : `Disabled (${bundles.length - activeBundles})`}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy bundles URL
        </button>
      </div>

      {/* Bundle list */}
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(bundle => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                onToggle={handleToggle}
                onEdit={setEditingBundle}
                onDelete={(id) => setDeleteConfirmId(id)}
                onShare={handleShare}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="rounded-2xl bg-muted/40 p-5 mb-4">
              <Layers className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">No bundles yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {filter === "all"
                ? "Create your first product bundle to offer special combo deals to customers."
                : `No ${filter} bundles. Switch to "All" or create a new one.`}
            </p>
            {filter === "all" && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 flex items-center gap-2 rounded-xl bg-brand-purple px-4 py-2 text-xs font-semibold text-white hover:bg-brand-purple/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Create first bundle
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-brand-coral/10 p-2.5">
                  <Trash2 className="h-4 w-4 text-brand-coral" />
                </div>
                <div>
                  <p className="text-sm font-bold">Delete bundle?</p>
                  <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold hover:bg-accent transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 rounded-xl bg-brand-coral py-2.5 text-xs font-semibold text-white hover:bg-brand-coral/90 transition-colors">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <BundleForm onSave={handleCreate} onClose={() => setShowForm(false)} />
        )}
        {editingBundle && (
          <BundleForm initial={editingBundle} onSave={handleUpdate} onClose={() => setEditingBundle(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
