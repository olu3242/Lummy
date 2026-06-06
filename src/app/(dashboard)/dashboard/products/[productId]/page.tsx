"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Eye, ShoppingBag, TrendingUp, BarChart3,
  Edit3, Save, X, Copy, CheckCheck, ExternalLink,
  MessageCircle, Share2, ToggleLeft, ToggleRight,
  Package, Star, Zap, ChevronRight, AlertCircle,
  CheckCircle2, Truck, Home, Tag, Plus, Minus,
  Image as ImageIcon, Radio, ChevronDown, ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { mockProducts, mockOrders, type DashboardProduct } from "@/data/mock/dashboard"
import { formatMoney } from "@/lib/globalization"

const STATUSES = ["active", "draft", "sold_out"] as const
type ProductStatus = typeof STATUSES[number]

const statusConfig: Record<ProductStatus, { label: string; color: string; bg: string; border: string }> = {
  active:   { label: "Active",   color: "text-brand-green",      bg: "bg-brand-green/10",  border: "border-brand-green/20"  },
  draft:    { label: "Draft",    color: "text-muted-foreground",  bg: "bg-muted",           border: "border-border"          },
  sold_out: { label: "Sold Out", color: "text-amber-500",         bg: "bg-amber-500/10",    border: "border-amber-500/20"    },
}

const orderStatusConfig = {
  pending:    { label: "Pending",    icon: CheckCircle2, color: "text-muted-foreground", bg: "bg-muted"          },
  confirmed:  { label: "Confirmed",  icon: CheckCircle2, color: "text-brand-purple",     bg: "bg-brand-purple/10"},
  processing: { label: "Processing", icon: Package,      color: "text-amber-500",        bg: "bg-amber-500/10"   },
  shipped:    { label: "Shipped",    icon: Truck,        color: "text-blue-500",         bg: "bg-blue-500/10"    },
  delivered:  { label: "Delivered",  icon: Home,         color: "text-brand-green",      bg: "bg-brand-green/10" },
  cancelled:  { label: "Cancelled",  icon: X,            color: "text-brand-coral",      bg: "bg-brand-coral/10" },
}

const MOCK_WEEKLY_VIEWS    = [42, 67, 53, 88, 112, 94, 78, 103, 124, 89, 61, 79, 98, 115]
const MOCK_DAILY_REVENUE   = [18000, 34000, 22000, 51000, 41000, 63000, 47000]
const DAYS_SHORT           = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

interface Variant {
  id: string; label: string; stock: number; sku: string
}

const DEFAULT_VARIANTS: Variant[] = [
  { id: "v1", label: "S / Black",  stock: 12, sku: "PRD-BLK-S" },
  { id: "v2", label: "M / Black",  stock: 8,  sku: "PRD-BLK-M" },
  { id: "v3", label: "L / Black",  stock: 3,  sku: "PRD-BLK-L" },
  { id: "v4", label: "M / Caramel",stock: 0,  sku: "PRD-CAR-M" },
]

function ViewsSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 280; const height = 56
  const step = width / (data.length - 1)
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 8) - 4}`)
  const pathD = `M ${points.join(" L ")}`
  const areaD = `M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-14" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(108,78,243)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(108,78,243)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#spark-gradient)" />
      <path d={pathD} stroke="rgb(108,78,243)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RevenueBars({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1.5 h-12">
      {data.map((v, i) => {
        const h = Math.max(4, (v / max) * 44)
        return (
          <div key={i} className="flex flex-col items-center flex-1 gap-1">
            <div className="w-full rounded-t-sm transition-all"
              style={{ height: h, background: i === data.length - 1 ? "#10B981" : "#10B981", opacity: i === data.length - 1 ? 1 : 0.5 }} />
            <span className="text-[8px] text-muted-foreground">{DAYS_SHORT[i]}</span>
          </div>
        )
      })}
    </div>
  )
}

/** 3-step sales funnel mini */
function SalesFunnel({ views, waClicks, orders }: { views: number; waClicks: number; orders: number }) {
  const steps = [
    { label: "Views",       value: views,    pct: 100,                                              color: "bg-brand-purple" },
    { label: "WA Clicks",   value: waClicks, pct: views > 0 ? Math.round((waClicks / views) * 100) : 0, color: "bg-[#25D366]"    },
    { label: "Orders",      value: orders,   pct: views > 0 ? Math.round((orders / views) * 100)   : 0, color: "bg-amber-500"    },
  ]
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={s.label} className="space-y-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-sm", s.color)} />
              {s.label}
            </span>
            <span className="font-semibold">{s.value.toLocaleString()} <span className="text-muted-foreground font-normal">({s.pct}%)</span></span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div className={cn("h-full rounded-full", s.color)}
              initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: "easeOut" }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function VariantsPanel({ variants, onUpdateStock }: {
  variants: Variant[]
  onUpdateStock: (id: string, delta: number) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Variants & Stock</p>
        <button onClick={() => toast({ title: "Variant editor coming soon!" })}
          className="flex items-center gap-1 text-[10px] text-brand-purple hover:underline font-semibold">
          <Plus className="h-3 w-3" /> Add variant
        </button>
      </div>
      <div className="space-y-2">
        {variants.map(v => (
          <div key={v.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{v.label}</p>
              <p className="text-[9px] text-muted-foreground">{v.sku}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => onUpdateStock(v.id, -1)}
                className="w-6 h-6 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Minus className="h-2.5 w-2.5" />
              </button>
              <span className={cn("w-8 text-center text-xs font-bold",
                v.stock === 0 ? "text-brand-coral" : v.stock <= 3 ? "text-amber-500" : "")}>
                {v.stock}
              </span>
              <button onClick={() => onUpdateStock(v.id, 1)}
                className="w-6 h-6 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>
            <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0",
              v.stock === 0 ? "bg-brand-coral/10 text-brand-coral" :
              v.stock <= 3  ? "bg-amber-500/10 text-amber-500" :
                              "bg-brand-green/10 text-brand-green")}>
              {v.stock === 0 ? "Out" : v.stock <= 3 ? "Low" : "OK"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
        <span>Total stock</span>
        <span className="font-bold text-foreground">{variants.reduce((s, v) => s + v.stock, 0)} units</span>
      </div>
    </div>
  )
}

function RestockLog() {
  const logs = [
    { date: "May 8, 2026",  qty: 20, note: "Supplier delivery" },
    { date: "Apr 21, 2026", qty: 15, note: "Manual restock"    },
    { date: "Apr 3, 2026",  qty: 30, note: "Supplier delivery" },
    { date: "Mar 12, 2026", qty: 10, note: "Sample batch"      },
  ]
  const [open, setOpen] = React.useState(false)
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
        <span className="text-xs font-semibold flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-brand-purple" /> Restock Log
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t border-border divide-y divide-border">
              {logs.map((l, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-xs font-semibold">+{l.qty} units</p>
                    <p className="text-[9px] text-muted-foreground">{l.note}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{l.date}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PhotoGallery({ product }: { product: DashboardProduct }) {
  const [active, setActive] = React.useState(0)
  const images = [product.image, product.image, product.image, product.image]
  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted">
        <Image src={images[active]} alt={product.name} fill className="object-cover" unoptimized />
        <div className="absolute top-2 left-2">
          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold border",
            statusConfig[product.status].bg, statusConfig[product.status].color, statusConfig[product.status].border)}>
            {statusConfig[product.status].label}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        {images.map((img, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={cn("relative flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all",
              active === i ? "border-brand-purple" : "border-border opacity-60 hover:opacity-100")}>
            <Image src={img} alt="" fill className="object-cover" unoptimized />
          </button>
        ))}
        <button onClick={() => toast({ title: "Photo upload coming soon!" })}
          className="flex-1 aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:border-brand-purple/40 hover:bg-brand-purple/5 transition-all">
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const productId = params.productId as string

  const [product,    setProduct]    = React.useState<DashboardProduct | null>(null)
  const [productLoading, setProductLoading] = React.useState(true)
  const [editing,    setEditing]    = React.useState<"price" | "stock" | "description" | null>(null)
  const [editPrice,  setEditPrice]  = React.useState("")
  const [editStock,  setEditStock]  = React.useState("")
  const [editDescription, setEditDescription] = React.useState("")
  const [copied,     setCopied]     = React.useState(false)
  const [activeTab,  setActiveTab]  = React.useState<"overview" | "analytics" | "orders">("overview")
  const [variants,   setVariants]   = React.useState<Variant[]>(DEFAULT_VARIANTS)

  React.useEffect(() => {
    if (!productId) return
    fetch(`/api/products/${productId}`)
      .then(r => r.ok ? r.json() : null)
      .then((result: { data?: { id: string; title: string; description?: string; price: number; image_url?: string; status?: string; created_at: string } } | null) => {
        if (result?.data) {
          const d = result.data
          setProduct({
            id: d.id,
            name: d.title,
            description: d.description ?? "",
            price: Math.round(d.price / 100),
            stock: null,
            category: "Other",
            status: (d.status ?? "active") as DashboardProduct["status"],
            image: d.image_url ?? "",
            whatsappEnabled: true,
            sales: 0, views: 0, revenue: 0,
            createdAt: d.created_at?.split("T")[0] ?? "",
          })
        }
      })
      .catch(() => {})
      .finally(() => setProductLoading(false))
  }, [productId])

  if (productLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">Product not found</p>
          <p className="text-xs text-muted-foreground mt-1">This product may not exist or was deleted.</p>
        </div>
        <Link href="/dashboard/products">
          <Button size="sm" variant="outline" className="gap-1.5"><ArrowLeft className="h-3.5 w-3.5" /> Back to Products</Button>
        </Link>
      </div>
    )
  }

  const sc = statusConfig[product.status]
  const conversion  = product.views > 0 ? ((product.sales / product.views) * 100).toFixed(1) : "0.0"
  const avgOrderVal = product.sales > 0 ? Math.round(product.revenue / product.sales) : product.price
  const storeUrl    = `${typeof window !== "undefined" ? window.location.origin : "https://lummy.co"}/p/${product.id}`
  const waClicks    = Math.round(product.views * 0.33)

  const productOrders = mockOrders.filter((o) => o.product.name === product.name).slice(0, 8)

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl)
    setCopied(true)
    toast({ title: "Link copied!", variant: "success" })
    setTimeout(() => setCopied(false), 2000)
  }

  const buildWAShare = () => {
    const msg = `Check out ${product.name} on my store! 🛍 Only ${formatMoney(product.price)}. Order here: ${storeUrl}`
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }

  const startEdit = (field: "price" | "stock" | "description") => {
    if (field === "price")       setEditPrice(String(product.price))
    if (field === "stock")       setEditStock(product.stock !== null ? String(product.stock) : "")
    if (field === "description") setEditDescription(product.description)
    setEditing(field)
  }

  const saveEdit = (field: "price" | "stock" | "description") => {
    if (field === "price") {
      const val = Number(editPrice)
      if (!val || val <= 0) { toast({ title: "Invalid price" }); return }
      setProduct((p) => p ? { ...p, price: val } : p)
      toast({ title: "Price updated", variant: "success" })
    }
    if (field === "stock") {
      const val = editStock === "" ? null : Number(editStock)
      setProduct((p) => p ? { ...p, stock: val } : p)
      toast({ title: "Stock updated", variant: "success" })
    }
    if (field === "description") {
      setProduct((p) => p ? { ...p, description: editDescription } : p)
      toast({ title: "Description updated", variant: "success" })
    }
    setEditing(null)
  }

  const toggleStatus = (status: ProductStatus) => {
    setProduct((p) => p ? { ...p, status } : p)
    toast({ title: `Status set to ${statusConfig[status].label}`, variant: "success" })
  }

  const toggleWhatsApp = () => {
    setProduct((p) => p ? { ...p, whatsappEnabled: !p.whatsappEnabled } : p)
    toast({ title: product.whatsappEnabled ? "WhatsApp CTA disabled" : "WhatsApp CTA enabled", variant: "success" })
  }

  const updateVariantStock = (id: string, delta: number) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, stock: Math.max(0, v.stock + delta) } : v))
  }

  const statCards = [
    { label: "Total Views",  value: product.views.toLocaleString(),         icon: Eye,         color: "text-brand-purple", sub: "All time"     },
    { label: "Units Sold",   value: product.sales.toLocaleString(),          icon: ShoppingBag, color: "text-brand-green",  sub: "All time"     },
    { label: "Revenue",      value: formatMoney(product.revenue),             icon: TrendingUp,  color: "text-amber-500",    sub: "Gross"        },
    { label: "Conversion",   value: `${conversion}%`,                        icon: BarChart3,   color: "text-brand-coral",  sub: "Views→Sales"  },
  ]

  const weeklyRevenue = MOCK_DAILY_REVENUE.reduce((s, v) => s + v, 0)
  const prevWeekRev   = Math.round(weeklyRevenue * 0.88)

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <span>/</span>
        <Link href="/dashboard/products" className="hover:text-foreground transition-colors">Products</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </div>

      {/* Hero — image gallery on mobile, beside info on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
        {/* Gallery */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <PhotoGallery product={product} />
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-extrabold leading-tight">{product.name}</h1>
              <p className="text-xs text-muted-foreground mt-1">{product.category} · Added {new Date(product.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(product)); toast({ title: "Product data copied!" }) }}
                className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <Link href={`/dashboard/products/new?edit=${product.id}`}>
                <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs"><Edit3 className="h-3.5 w-3.5" /> Edit</Button>
              </Link>
            </div>
          </div>

          {/* Quick-edit fields */}
          <div className="grid grid-cols-3 gap-3">
            {/* Price */}
            <div className="rounded-xl border border-border p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Price</p>
              {editing === "price" ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">$</span>
                  <input autoFocus value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number"
                    className="flex-1 w-full text-sm font-bold bg-transparent outline-none border-b border-brand-purple"
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit("price"); if (e.key === "Escape") setEditing(null) }} />
                  <button onClick={() => saveEdit("price")} className="text-brand-green"><Save className="h-3 w-3" /></button>
                  <button onClick={() => setEditing(null)} className="text-muted-foreground"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <div className="flex items-center justify-between group">
                  <p className="text-sm font-bold text-brand-purple">{formatMoney(product.price)}</p>
                  <button onClick={() => startEdit("price")} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit3 className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>

            {/* Stock */}
            <div className="rounded-xl border border-border p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Stock</p>
              {editing === "stock" ? (
                <div className="flex items-center gap-1">
                  <input autoFocus value={editStock} onChange={(e) => setEditStock(e.target.value)} type="number" placeholder="∞"
                    className="flex-1 w-full text-sm font-bold bg-transparent outline-none border-b border-brand-purple"
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit("stock"); if (e.key === "Escape") setEditing(null) }} />
                  <button onClick={() => saveEdit("stock")} className="text-brand-green"><Save className="h-3 w-3" /></button>
                  <button onClick={() => setEditing(null)} className="text-muted-foreground"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <div className="flex items-center justify-between group">
                  <p className={cn("text-sm font-bold", product.stock === 0 ? "text-brand-coral" : product.stock !== null && product.stock <= 10 ? "text-amber-500" : "")}>
                    {product.stock === null ? "∞" : product.stock === 0 ? "Out" : `${product.stock}`}
                  </p>
                  <button onClick={() => startEdit("stock")} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit3 className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>

            {/* Avg order */}
            <div className="rounded-xl border border-border p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Avg Order</p>
              <p className="text-sm font-bold">{formatMoney(avgOrderVal)}</p>
            </div>
          </div>

          {/* Status toggles */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => toggleStatus(s)}
                  className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all",
                    product.status === s
                      ? `${statusConfig[s].bg} ${statusConfig[s].color} ${statusConfig[s].border}`
                      : "border-border text-muted-foreground hover:border-foreground/20")}>
                  {statusConfig[s].label}
                </button>
              ))}
            </div>
            <button onClick={toggleWhatsApp}
              className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all",
                product.whatsappEnabled ? "bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20" : "border-border text-muted-foreground")}>
              {product.whatsappEnabled ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
              WhatsApp CTA
            </button>
          </div>

          {/* Share */}
          <div className="flex flex-wrap gap-2">
            <button onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-accent transition-colors">
              {copied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
            <a href={buildWAShare()} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 text-[#25D366] text-xs font-medium hover:bg-[#25D366]/10 transition-colors">
              <MessageCircle className="h-3.5 w-3.5 fill-[#25D366]/60" /> Share on WhatsApp
            </a>
            <a href={`/dashboard/store`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-accent transition-colors">
              <ExternalLink className="h-3.5 w-3.5" /> View on store
            </a>
            <button onClick={() => toast({ title: "Added to broadcast draft!", variant: "success" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-purple/20 bg-brand-purple/5 text-brand-purple text-xs font-medium hover:bg-brand-purple/10 transition-colors">
              <Radio className="h-3.5 w-3.5" /> Broadcast
            </button>
          </div>
        </motion.div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
              <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
            </div>
            <p className="font-display text-xl font-extrabold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl border border-border bg-muted/30 w-fit">
        {(["overview", "analytics", "orders"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
              activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {tab === "orders" ? `Orders (${productOrders.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {/* Views sparkline */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Daily Views (Last 14 days)</p>
                  <span className="text-xs font-bold text-brand-purple">+{Math.round(((MOCK_WEEKLY_VIEWS[13] - MOCK_WEEKLY_VIEWS[0]) / MOCK_WEEKLY_VIEWS[0]) * 100)}%</span>
                </div>
                <ViewsSparkline data={MOCK_WEEKLY_VIEWS} />
              </div>

              {/* Description */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</p>
                  {editing !== "description" ? (
                    <button onClick={() => startEdit("description")} className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => saveEdit("description")} className="p-1 rounded-lg hover:bg-brand-green/10 text-brand-green transition-colors"><Save className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setEditing(null)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
                {editing === "description" ? (
                  <textarea autoFocus value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-purple/30 leading-relaxed" />
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                )}
              </div>

              {/* Variants */}
              <VariantsPanel variants={variants} onUpdateStock={updateVariantStock} />

              {/* Restock log */}
              <RestockLog />
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              {/* Performance summary */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Performance</p>
                <div className="space-y-3">
                  {[
                    { label: "Revenue rank",    value: "#1 in store",  icon: Star,          color: "text-amber-500"  },
                    { label: "Repeat buyers",   value: "34%",          icon: TrendingUp,    color: "text-brand-green"},
                    { label: "WhatsApp clicks", value: waClicks.toString(), icon: MessageCircle, color: "text-[#25D366]" },
                    { label: "Avg fulfil time", value: "1.8 days",     icon: Truck,         color: "text-brand-purple"},
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <row.icon className={cn("h-3.5 w-3.5", row.color)} /> {row.label}
                      </div>
                      <span className="text-xs font-semibold">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock alerts */}
              {product.stock !== null && product.stock <= 10 && product.stock > 0 && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-600">Low stock warning</p>
                      <p className="text-[10px] text-amber-500/80 mt-0.5">Only {product.stock} units left.</p>
                      <Link href="/dashboard/inventory"><button className="mt-2 text-[10px] font-semibold text-amber-600 hover:underline">Go to Inventory →</button></Link>
                    </div>
                  </div>
                </div>
              )}
              {product.stock === 0 && (
                <div className="rounded-2xl border border-brand-coral/20 bg-brand-coral/5 p-4">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-brand-coral flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-brand-coral">Out of stock</p>
                      <p className="text-[10px] text-brand-coral/70 mt-0.5">Hidden from your storefront.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick links */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Links</p>
                <div className="space-y-1">
                  {[
                    { label: "Add a discount code", href: "/dashboard/discounts",  icon: Tag      },
                    { label: "View inventory",       href: "/dashboard/inventory",  icon: Package  },
                    { label: "See analytics",        href: "/dashboard/analytics",  icon: BarChart3},
                    { label: "Share via broadcast",  href: "/dashboard/broadcast",  icon: Zap      },
                  ].map((link) => (
                    <Link key={link.label} href={link.href}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-accent transition-colors group">
                      <div className="flex items-center gap-2.5 text-xs font-medium">
                        <link.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-brand-purple transition-colors" />
                        {link.label}
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "analytics" && (
          <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Weekly revenue bars */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Revenue — This Week</p>
                <span className={cn("text-xs font-bold", weeklyRevenue >= prevWeekRev ? "text-brand-green" : "text-brand-coral")}>
                  {weeklyRevenue >= prevWeekRev ? "+" : ""}{Math.round(((weeklyRevenue - prevWeekRev) / prevWeekRev) * 100)}% vs last week
                </span>
              </div>
              <RevenueBars data={MOCK_DAILY_REVENUE} />
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total this week</span>
                <span className="font-bold text-brand-green">{formatMoney(weeklyRevenue)}</span>
              </div>
            </div>

            {/* Sales funnel */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sales Funnel</p>
              <SalesFunnel views={product.views} waClicks={waClicks} orders={product.sales} />
              <p className="text-[10px] text-muted-foreground mt-3">
                <span className="font-semibold text-foreground">{((product.sales / product.views) * 100).toFixed(1)}%</span> of viewers become buyers.
                Industry avg is <span className="font-semibold">2.5%</span>.
              </p>
            </div>

            {/* Top customer segments */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Buyer Segments</p>
              <div className="space-y-2">
                {[
                  { label: "Repeat buyers",   pct: 34, color: "bg-brand-purple" },
                  { label: "WhatsApp orders", pct: 58, color: "bg-[#25D366]"    },
                  { label: "First-time",      pct: 66, color: "bg-brand-coral"  },
                  { label: "Gifters",         pct: 12, color: "bg-amber-500"    },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{s.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div className={cn("h-full rounded-full", s.color)}
                        initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }} />
                    </div>
                    <span className="text-xs font-bold w-8 text-right">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak days */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sales by Day of Week</p>
              <div className="flex items-end gap-1.5 h-16">
                {[
                  { day: "Mon", v: 12 }, { day: "Tue", v: 18 }, { day: "Wed", v: 15 },
                  { day: "Thu", v: 22 }, { day: "Fri", v: 28 }, { day: "Sat", v: 35 }, { day: "Sun", v: 31 },
                ].map((d, i) => {
                  const maxV = 35
                  const h = Math.max(4, (d.v / maxV) * 52)
                  const isWeekend = i >= 5
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-sm"
                        style={{ height: h, backgroundColor: isWeekend ? "#6C4EF3" : "#6C4EF380" }} />
                      <span className="text-[8px] text-muted-foreground">{d.day}</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">Weekends drive <span className="font-semibold text-foreground">47%</span> of this product&apos;s weekly sales.</p>
            </div>
          </motion.div>
        )}

        {activeTab === "orders" && (
          <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-border bg-card overflow-hidden">
            {productOrders.length === 0 ? (
              <div className="py-16 text-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-semibold">No orders yet</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-[1fr_140px_100px_80px_80px] gap-4 px-5 py-2.5 border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                  <span>Customer</span><span>Date</span><span>Status</span><span className="text-right">Qty</span><span className="text-right">Amount</span>
                </div>
                <div className="divide-y divide-border">
                  {productOrders.map((order, i) => {
                    const osc = orderStatusConfig[order.status] ?? orderStatusConfig.confirmed
                    const StatusIcon = osc.icon
                    return (
                      <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_140px_100px_80px_80px] gap-2 sm:gap-4 px-5 py-3.5 items-center hover:bg-accent/30 transition-colors">
                        <div>
                          <p className="text-sm font-semibold">{order.customer.name}</p>
                          <p className="text-[10px] text-muted-foreground">#{order.orderNumber}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit", osc.bg, osc.color)}>
                          <StatusIcon className="h-2.5 w-2.5" />{osc.label}
                        </span>
                        <p className="text-sm font-semibold text-right">1</p>
                        <p className="text-sm font-bold text-right text-brand-purple">{formatMoney(order.amount)}</p>
                      </motion.div>
                    )
                  })}
                </div>
                <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">Showing {productOrders.length} recent orders</p>
                  <Link href="/dashboard/orders" className="text-[11px] font-semibold text-brand-purple hover:underline">View all →</Link>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
