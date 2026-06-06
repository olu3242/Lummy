"use client"

import * as React from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package, AlertTriangle, TrendingDown, TrendingUp,
  Plus, Minus, Search, X, CheckCheck, Download,
  ChevronDown, ChevronUp, Edit2, History, Bot,
  BarChart3, Clock, Zap, ArrowRight, Settings,
  CheckSquare, Square, Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { formatCompactMoney } from "@/lib/globalization"
import { mockProducts, type DashboardProduct } from "@/data/mock/dashboard"

type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "unlimited"

interface StockAdjustment {
  id: string; productId: string; productName: string
  type: "restock" | "sale" | "manual_add" | "manual_remove" | "damage"
  delta: number; before: number; after: number; note?: string; date: string
  supplier?: string
}

interface ReorderRule {
  productId: string; threshold: number; autoAlert: boolean
}

const LOW_STOCK_THRESHOLD = 10

function getStockStatus(stock: number | null): StockStatus {
  if (stock === null) return "unlimited"
  if (stock === 0) return "out_of_stock"
  if (stock <= LOW_STOCK_THRESHOLD) return "low_stock"
  return "in_stock"
}

const STATUS_CONFIG: Record<StockStatus, { label: string; color: string; bg: string; border: string }> = {
  in_stock:    { label: "In stock",    color: "text-brand-green",  bg: "bg-brand-green/10",  border: "border-brand-green/20"  },
  low_stock:   { label: "Low stock",   color: "text-amber-500",    bg: "bg-amber-500/10",    border: "border-amber-500/20"    },
  out_of_stock:{ label: "Out of stock",color: "text-brand-coral",  bg: "bg-brand-coral/10",  border: "border-brand-coral/20"  },
  unlimited:   { label: "Unlimited",   color: "text-brand-purple", bg: "bg-brand-purple/10", border: "border-brand-purple/20" },
}

const ADJUSTMENT_TYPES = [
  { id: "restock",       label: "Restock",      delta: 1  },
  { id: "manual_add",    label: "Manual add",   delta: 1  },
  { id: "manual_remove", label: "Remove",       delta: -1 },
  { id: "damage",        label: "Damage/Loss",  delta: -1 },
] as const

const mockHistory: StockAdjustment[] = [
  { id: "h1", productId: "p1", productName: "Ankara Print Dress",     type: "sale",         delta: -3, before: 17, after: 14, date: "May 12, 10:21 AM" },
  { id: "h2", productId: "p3", productName: "Leather Mini Bag",       type: "restock",      delta: 20, before: 8,  after: 28, date: "May 11, 3:05 PM", note: "New batch from supplier", supplier: "Yusuf Traders" },
  { id: "h3", productId: "p2", productName: "Beaded Necklace Set",    type: "sale",         delta: -2, before: 34, after: 32, date: "May 11, 1:14 PM" },
  { id: "h4", productId: "p5", productName: "Aso-Oke Gele",           type: "manual_remove",delta: -1, before: 4,  after: 3,  date: "May 10, 9:47 AM", note: "Display damage" },
  { id: "h5", productId: "p1", productName: "Ankara Print Dress",     type: "restock",      delta: 10, before: 7,  after: 17, date: "May 9, 2:30 PM", note: "Urgent restock", supplier: "Abeokuta Textiles" },
  { id: "h6", productId: "p4", productName: "Perfume Collection Box", type: "sale",         delta: -1, before: 12, after: 11, date: "May 9, 11:58 AM" },
  { id: "h7", productId: "p6", productName: "Embroidered Kaftan",     type: "damage",       delta: -2, before: 6,  after: 4,  date: "May 8, 4:12 PM", note: "Transit damage" },
]

const AI_SUGGESTIONS = [
  { productName: "Leather Mini Bag",   message: "Selling 14 units/week. Stock runs out in ~6 days — restock now.", urgency: "high"   as const },
  { productName: "Aso-Oke Gele",       message: "Only 3 left with 2 pending orders. Prioritise before the weekend.", urgency: "high"   as const },
  { productName: "Ankara Print Dress", message: "Strong velocity — you'll need 25+ units for next week's flash sale.", urgency: "medium" as const },
  { productName: "Beaded Necklace Set",message: "Steady demand. Restock to 50+ for the upcoming festive season.",      urgency: "low"    as const },
]

// Approx daily sales rate per product (units/day, used for forecast)
const DAILY_VELOCITY: Record<string, number> = {
  p1: 2.1, p2: 1.4, p3: 1.8, p4: 0.9, p5: 0.4, p6: 0.7, p7: 1.1, p8: 0.3,
}

function daysLeft(product: DashboardProduct): number | null {
  if (product.stock === null) return null
  const rate = DAILY_VELOCITY[product.id] ?? 0.5
  return Math.floor(product.stock / rate)
}

// ── Category Inventory Donut ─────────────────────────────────────────────────
function CategoryDonut({ products }: { products: DashboardProduct[] }) {
  const catMap: Record<string, number> = {}
  products.forEach(p => {
    catMap[p.category] = (catMap[p.category] ?? 0) + (p.stock ?? 0) * p.price
  })
  const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1
  const COLORS = ["#6C4EF3", "#10B981", "#F59E0B", "#F97316", "#4F46E5", "#F43F5E"]
  const r = 36, cx = 44, cy = 44, circ = 2 * Math.PI * r
  let offset = 0
  const slices = entries.map(([cat, val], i) => {
    const pct = val / total
    const dash = pct * circ
    const s = { cat, val, dash, gap: circ - dash, offset, color: COLORS[i % COLORS.length] }
    offset += dash
    return s
  })

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-brand-purple" />
        <p className="text-sm font-semibold">Inventory by Category</p>
      </div>
      <div className="flex items-center gap-5">
        <svg width={88} height={88} viewBox="0 0 88 88" className="flex-shrink-0">
          {slices.map(({ cat, dash, gap, offset, color }) => (
            <circle key={cat} cx={cx} cy={cy} r={r} fill="none" stroke={color}
              strokeWidth={12} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset}
              style={{ transform: "rotate(-90deg)", transformOrigin: "44px 44px" }} />
          ))}
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: 10, fontWeight: 700, fill: "currentColor" }}>
            {formatCompactMoney(total)}
          </text>
        </svg>
        <div className="space-y-1.5 flex-1 min-w-0">
          {slices.slice(0, 4).map(({ cat, val, color }) => (
            <div key={cat} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[10px] text-muted-foreground truncate flex-1">{cat}</span>
              <span className="text-[10px] font-semibold flex-shrink-0">{formatCompactMoney(val)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Forecast Chip ────────────────────────────────────────────────────────────
function ForecastChip({ days }: { days: number | null }) {
  if (days === null) return <span className="text-[10px] text-muted-foreground">∞</span>
  if (days === 0) return <span className="text-[10px] font-semibold text-brand-coral">Out now</span>
  const color = days <= 3 ? "text-brand-coral" : days <= 7 ? "text-amber-500" : "text-brand-green"
  return (
    <span className={cn("text-[10px] font-semibold flex items-center gap-0.5", color)}>
      <Clock className="h-2.5 w-2.5" />~{days}d
    </span>
  )
}

// ── Reorder Rules Panel ──────────────────────────────────────────────────────
function ReorderPanel({ products, rules, onChange, onClose }: {
  products: DashboardProduct[]
  rules: Record<string, ReorderRule>
  onChange: (r: Record<string, ReorderRule>) => void
  onClose: () => void
}) {
  const [local, setLocal] = React.useState(rules)
  const save = () => { onChange(local); onClose(); toast({ title: "Reorder rules saved", variant: "success" }) }
  const getRule = (id: string): ReorderRule =>
    local[id] ?? { productId: id, threshold: LOW_STOCK_THRESHOLD, autoAlert: true }
  const update = (id: string, patch: Partial<ReorderRule>) =>
    setLocal(p => ({ ...p, [id]: { ...getRule(id), ...patch } }))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-brand-purple" />
            <h2 className="font-display font-bold text-sm">Reorder Rules</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {products.filter(p => p.stock !== null).map(p => {
            const rule = getRule(p.id)
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  <Image src={p.image} alt={p.name} fill className="object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <label className="text-[10px] text-muted-foreground">Alert at</label>
                    <input type="number" min={1} max={100} value={rule.threshold}
                      onChange={e => update(p.id, { threshold: Math.max(1, Number(e.target.value)) })}
                      className="w-14 h-6 px-2 rounded-lg border border-border bg-background text-xs text-center focus:outline-none focus:ring-1 focus:ring-brand-purple/40" />
                    <label className="text-[10px] text-muted-foreground">units</label>
                  </div>
                </div>
                <button onClick={() => update(p.id, { autoAlert: !rule.autoAlert })} className="p-1 flex-shrink-0">
                  {rule.autoAlert
                    ? <Zap className="h-4 w-4 text-amber-500" aria-label="Auto-alert on" />
                    : <Zap className="h-4 w-4 text-muted-foreground/40" aria-label="Auto-alert off" />}
                </button>
              </div>
            )
          })}
        </div>
        <div className="flex-shrink-0 border-t border-border p-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 h-9" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="flex-1 h-9" onClick={save}>Save rules</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Adjust Drawer ────────────────────────────────────────────────────────────
interface AdjustDrawerProps {
  product: DashboardProduct
  onClose: () => void
  onSave: (productId: string, newStock: number, adj: StockAdjustment) => void
}

function AdjustDrawer({ product, onClose, onSave }: AdjustDrawerProps) {
  const [type, setType] = React.useState<"restock" | "manual_add" | "manual_remove" | "damage">("restock")
  const [qty, setQty] = React.useState(1)
  const [note, setNote] = React.useState("")
  const [supplier, setSupplier] = React.useState("")
  const currentStock = product.stock ?? 0

  const adjustedStock = type === "restock" || type === "manual_add"
    ? currentStock + qty : Math.max(0, currentStock - qty)
  const delta = adjustedStock - currentStock

  const handleSave = () => {
    if (qty <= 0) { toast({ title: "Enter a valid quantity" }); return }
    const adj: StockAdjustment = {
      id: `h${Date.now()}`, productId: product.id, productName: product.name,
      type, delta, before: currentStock, after: adjustedStock,
      note: note || undefined, supplier: supplier || undefined, date: "Just now",
    }
    onSave(product.id, adjustedStock, adj)
    onClose()
    toast({ title: "Stock updated!", description: `${product.name}: ${currentStock} → ${adjustedStock} units`, variant: "success" })
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-card border-l border-border flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <h2 className="font-display font-bold text-sm">Adjust Stock</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Product mini card */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
              <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{product.name}</p>
              <p className="text-[10px] text-muted-foreground">Current: <span className="font-bold text-foreground">{currentStock} units</span></p>
            </div>
          </div>

          {/* Adjustment type */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Adjustment type</label>
            <div className="grid grid-cols-2 gap-2">
              {ADJUSTMENT_TYPES.map(t => (
                <button key={t.id} onClick={() => setType(t.id)}
                  className={cn("p-3 rounded-xl border text-xs font-semibold text-left transition-all flex items-center gap-2",
                    type === t.id ? "border-brand-purple/30 bg-brand-purple/5 text-brand-purple" : "border-border hover:bg-muted text-muted-foreground")}>
                  {t.delta > 0
                    ? <TrendingUp className="h-3.5 w-3.5 text-brand-green flex-shrink-0" />
                    : <TrendingDown className="h-3.5 w-3.5 text-brand-coral flex-shrink-0" />}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Quantity</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Minus className="h-4 w-4" />
              </button>
              <input type="number" value={qty} min={1}
                onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                className="flex-1 h-10 text-center text-lg font-bold rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
              <button onClick={() => setQty(q => q + 1)}
                className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className={cn("p-4 rounded-xl border text-sm",
            delta >= 0 ? "border-brand-green/20 bg-brand-green/5" : "border-brand-coral/20 bg-brand-coral/5")}>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current stock</span>
              <span className="font-bold">{currentStock}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-muted-foreground">Adjustment</span>
              <span className={cn("font-bold", delta >= 0 ? "text-brand-green" : "text-brand-coral")}>
                {delta >= 0 ? "+" : ""}{delta}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-border font-bold">
              <span>New stock</span>
              <span className={delta >= 0 ? "text-brand-green" : "text-brand-coral"}>{adjustedStock}</span>
            </div>
          </div>

          {/* Supplier */}
          {(type === "restock" || type === "manual_add") && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Supplier (optional)</label>
              <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="e.g. Abeokuta Textiles…"
                className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
            </div>
          )}

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Note (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              rows={2} placeholder="e.g. New supplier delivery, quality check removal…"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none" />
          </div>
        </div>

        <div className="flex-shrink-0 p-5 border-t border-border flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 gap-2" onClick={handleSave}>
            <CheckCheck className="h-4 w-4" /> Save adjustment
          </Button>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}

// ── Adjustment History Row ────────────────────────────────────────────────────
function AdjHistoryRow({ adj }: { adj: StockAdjustment }) {
  const isAdd = adj.delta >= 0
  const typeLabels: Record<string, string> = {
    restock: "Restocked", sale: "Sale", manual_add: "Added", manual_remove: "Removed", damage: "Damage"
  }
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0",
        isAdd ? "bg-brand-green/10" : "bg-brand-coral/10")}>
        {isAdd ? <TrendingUp className="h-3.5 w-3.5 text-brand-green" /> : <TrendingDown className="h-3.5 w-3.5 text-brand-coral" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{adj.productName}</p>
        <p className="text-[10px] text-muted-foreground">
          {typeLabels[adj.type]} · {adj.before} → {adj.after}
          {adj.supplier ? ` · ${adj.supplier}` : ""}
          {adj.note ? ` · ${adj.note}` : ""}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={cn("text-sm font-bold", isAdd ? "text-brand-green" : "text-brand-coral")}>
          {isAdd ? "+" : ""}{adj.delta}
        </p>
        <p className="text-[10px] text-muted-foreground">{adj.date}</p>
      </div>
    </div>
  )
}

// ── Bulk Restock Modal ────────────────────────────────────────────────────────
function BulkRestockModal({ products, onClose, onSave }: {
  products: DashboardProduct[]
  onClose: () => void
  onSave: (adjustments: { productId: string; qty: number }[]) => void
}) {
  const [qtys, setQtys] = React.useState<Record<string, number>>(
    Object.fromEntries(products.map(p => [p.id, 10]))
  )
  const total = Object.values(qtys).reduce((s, v) => s + v, 0)

  const handle = () => {
    const adjustments = products.map(p => ({ productId: p.id, qty: qtys[p.id] ?? 10 }))
    onSave(adjustments)
    onClose()
    toast({ title: `${products.length} products restocked`, description: `${total} units added`, variant: "success" })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-green" />
            <h2 className="font-display font-bold text-sm">Bulk Restock</h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20">{products.length} items</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                <Image src={p.image} alt={p.name} fill className="object-cover" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">Current: {p.stock ?? 0} units</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => setQtys(prev => ({ ...prev, [p.id]: Math.max(1, (prev[p.id] ?? 10) - 1) }))}
                  className="w-6 h-6 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                  <Minus className="h-3 w-3" />
                </button>
                <input type="number" min={1} value={qtys[p.id] ?? 10}
                  onChange={e => setQtys(prev => ({ ...prev, [p.id]: Math.max(1, Number(e.target.value)) }))}
                  className="w-12 h-6 text-center text-xs font-bold rounded-lg border border-border bg-background focus:outline-none" />
                <button onClick={() => setQtys(prev => ({ ...prev, [p.id]: (prev[p.id] ?? 10) + 1 }))}
                  className="w-6 h-6 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex-shrink-0 border-t border-border p-4">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-muted-foreground">Total units to add</span>
            <span className="font-bold text-brand-green">+{total}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 h-9" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="flex-1 h-9 gap-1.5" onClick={handle}>
              <CheckCheck className="h-4 w-4" /> Restock all
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [products, setProducts] = React.useState<DashboardProduct[]>(mockProducts)
  const [history, setHistory] = React.useState<StockAdjustment[]>(mockHistory)
  const [adjustingProduct, setAdjustingProduct] = React.useState<DashboardProduct | null>(null)
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<StockStatus | "all">("all")
  const [sortBy, setSortBy] = React.useState<"name" | "stock" | "sales" | "forecast">("stock")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc")
  const [showHistory, setShowHistory] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [showBulkRestock, setShowBulkRestock] = React.useState(false)
  const [showReorderPanel, setShowReorderPanel] = React.useState(false)
  const [reorderRules, setReorderRules] = React.useState<Record<string, ReorderRule>>({})
  const [showDonut, setShowDonut] = React.useState(false)

  const handleAdjust = (productId: string, newStock: number, adj: StockAdjustment) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p))
    setHistory(prev => [adj, ...prev])
  }

  const handleBulkRestock = (adjustments: { productId: string; qty: number }[]) => {
    adjustments.forEach(({ productId, qty }) => {
      const p = products.find(p => p.id === productId)
      if (!p) return
      const newStock = (p.stock ?? 0) + qty
      const adj: StockAdjustment = {
        id: `h${Date.now()}-${productId}`, productId, productName: p.name,
        type: "restock", delta: qty, before: p.stock ?? 0, after: newStock, date: "Just now",
      }
      setProducts(prev => prev.map(pr => pr.id === productId ? { ...pr, stock: newStock } : pr))
      setHistory(prev => [adj, ...prev])
    })
    setSelectedIds(new Set())
  }

  const exportCSV = () => {
    const headers = ["Name", "Category", "Stock", "Status", "Price ($)", "Sold", "Value ($)", "Forecast (days)"]
    const rows = products.map(p => [
      p.name, p.category, p.stock ?? "Unlimited", STATUS_CONFIG[getStockStatus(p.stock)].label,
      p.price, p.sales, (p.stock ?? 0) * p.price, daysLeft(p) ?? "∞",
    ])
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `lummy-inventory-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast({ title: "CSV exported", variant: "success" })
  }

  const filtered = products
    .filter(p => {
      const status = getStockStatus(p.stock)
      if (filter !== "all" && status !== filter) return false
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
          !p.category.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      let diff = 0
      if (sortBy === "name") diff = a.name.localeCompare(b.name)
      else if (sortBy === "stock") diff = (a.stock ?? Infinity) - (b.stock ?? Infinity)
      else if (sortBy === "sales") diff = b.sales - a.sales
      else if (sortBy === "forecast") diff = (daysLeft(a) ?? 9999) - (daysLeft(b) ?? 9999)
      return sortDir === "asc" ? diff : -diff
    })

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortBy(col); setSortDir("asc") }
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col
      ? sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      : <ChevronDown className="h-3 w-3 opacity-30" />

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  const selectAll = () => setSelectedIds(new Set(filtered.map(p => p.id)))
  const clearSelection = () => setSelectedIds(new Set())

  const outOfStock = products.filter(p => p.stock === 0).length
  const lowStock   = products.filter(p => p.stock !== null && p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length
  const totalUnits = products.reduce((s, p) => s + (p.stock ?? 0), 0)
  const totalValue = products.reduce((s, p) => s + (p.stock ?? 0) * p.price, 0)
  const selectedProducts = products.filter(p => selectedIds.has(p.id))

  return (
    <div className="p-4 sm:p-6 space-y-5 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Stock levels, adjustments, and restock alerts</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className={cn("gap-1.5 h-9 text-xs", showDonut && "border-brand-purple/30 text-brand-purple")}
            onClick={() => setShowDonut(v => !v)}>
            <BarChart3 className="h-3.5 w-3.5" /> Breakdown
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs"
            onClick={() => setShowReorderPanel(true)}>
            <Settings className="h-3.5 w-3.5" /> Rules
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-1.5 h-9 text-xs" onClick={() => setShowHistory(v => !v)}>
            <History className="h-3.5 w-3.5" /> History
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total units",     value: totalUnits.toLocaleString(), icon: Package,       color: "text-brand-purple", bg: "bg-brand-purple/10" },
          { label: "Inventory value", value: formatCompactMoney(totalValue), icon: BarChart3, color: "text-brand-green", bg: "bg-brand-green/10" },
          { label: "Low stock",       value: lowStock,                    icon: AlertTriangle,  color: "text-amber-500",    bg: "bg-amber-500/10", alert: lowStock > 0 },
          { label: "Out of stock",    value: outOfStock,                  icon: TrendingDown,   color: "text-brand-coral",  bg: "bg-brand-coral/10", alert: outOfStock > 0 },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={cn("rounded-2xl border bg-card p-4 cursor-pointer hover:shadow-sm transition-shadow",
              s.alert ? "border-brand-coral/20" : "border-border")}
            onClick={() => s.alert && setFilter(s.label === "Low stock" ? "low_stock" : "out_of_stock")}>
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl mb-2", s.bg)}>
              <s.icon className={cn("h-4 w-4", s.color)} />
            </div>
            <p className="font-display text-xl font-extrabold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              {s.label}
              {s.alert && <ArrowRight className="h-2.5 w-2.5" />}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Category donut */}
      <AnimatePresence>
        {showDonut && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <CategoryDonut products={products} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI restock suggestions */}
      {(lowStock > 0 || outOfStock > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">AI Restock Suggestions</p>
            <button onClick={() => toast({ title: "Opening AI assistant…" })}
              className="ml-auto text-[10px] text-amber-600 font-semibold hover:underline flex items-center gap-0.5">
              Ask AI <ArrowRight className="h-2.5 w-2.5" />
            </button>
          </div>
          <div className="space-y-2">
            {AI_SUGGESTIONS.filter(s => s.urgency === "high" || s.urgency === "medium").map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className={cn("flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5",
                  s.urgency === "high" ? "bg-brand-coral" : "bg-amber-500")} />
                <div>
                  <span className="font-semibold text-foreground">{s.productName}:</span> {s.message}
                  <button onClick={() => {
                    const p = products.find(pr => pr.name === s.productName)
                    if (p) setAdjustingProduct(p)
                  }} className="ml-2 text-brand-purple font-semibold hover:underline">Restock →</button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-border">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
              className="w-full h-8 pl-9 pr-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>
          <div className="flex gap-1">
            {(["all", "in_stock", "low_stock", "out_of_stock"] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={cn("px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border",
                  filter === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
                {s === "all" ? "All" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk action bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-brand-purple/20 bg-brand-purple/5 px-5 py-2.5 flex items-center gap-3 flex-wrap overflow-hidden">
              <span className="text-xs font-semibold text-brand-purple">{selectedIds.size} selected</span>
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 px-2.5"
                onClick={() => setShowBulkRestock(true)}>
                <TrendingUp className="h-3 w-3 text-brand-green" /> Bulk restock
              </Button>
              <button onClick={clearSelection} className="ml-auto p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-[32px_1fr_100px_80px_80px_80px_120px] gap-4 px-5 py-2.5 border-b border-border bg-muted/30 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <button onClick={selectedIds.size === filtered.length ? clearSelection : selectAll} className="flex items-center">
            {selectedIds.size === filtered.length && filtered.length > 0
              ? <CheckSquare className="h-3.5 w-3.5 text-brand-purple" />
              : <Square className="h-3.5 w-3.5" />}
          </button>
          <button className="text-left flex items-center gap-1" onClick={() => toggleSort("name")}>
            Product <SortIcon col="name" />
          </button>
          <span className="text-center">Status</span>
          <button className="text-right flex items-center justify-end gap-1" onClick={() => toggleSort("stock")}>
            Stock <SortIcon col="stock" />
          </button>
          <button className="text-right flex items-center justify-end gap-1" onClick={() => toggleSort("sales")}>
            Sold <SortIcon col="sales" />
          </button>
          <button className="text-right flex items-center justify-end gap-1" onClick={() => toggleSort("forecast")}>
            Left <SortIcon col="forecast" />
          </button>
          <span className="text-right">Action</span>
        </div>

        {/* Rows */}
        <div>
          <AnimatePresence>
            {filtered.map((product, i) => {
              const status = getStockStatus(product.stock)
              const cfg = STATUS_CONFIG[status]
              const isLow = status === "low_stock" || status === "out_of_stock"
              const isSelected = selectedIds.has(product.id)
              const forecast = daysLeft(product)
              const rule = reorderRules[product.id]

              return (
                <motion.div key={product.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className={cn(
                    "grid grid-cols-1 sm:grid-cols-[32px_1fr_100px_80px_80px_80px_120px] gap-x-4 gap-y-2 px-5 py-3.5 border-b border-border last:border-0 items-center transition-colors",
                    "hover:bg-muted/20",
                    isSelected && "bg-brand-purple/5",
                    isLow && !isSelected && "bg-amber-500/3"
                  )}>
                  {/* Checkbox */}
                  <div className="flex items-center" onClick={() => toggleSelect(product.id)}>
                    {isSelected
                      ? <CheckSquare className="h-4 w-4 text-brand-purple cursor-pointer" />
                      : <Square className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />}
                  </div>

                  {/* Product info */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                      <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground">{product.category}</p>
                      {rule?.autoAlert && (
                        <p className="text-[9px] text-amber-500 flex items-center gap-0.5 mt-0.5">
                          <Zap className="h-2 w-2" /> Alert at {rule.threshold}u
                        </p>
                      )}
                    </div>
                    {isLow && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 ml-auto sm:hidden" />}
                  </div>

                  {/* Status */}
                  <div className="sm:text-center">
                    <span className={cn("inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border", cfg.bg, cfg.color, cfg.border)}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Stock */}
                  <div className="sm:text-right flex items-center sm:justify-end gap-1">
                    <span className={cn("text-sm font-bold", isLow ? "text-amber-500" : "text-foreground")}>
                      {product.stock === null ? "∞" : product.stock}
                    </span>
                    {isLow && <AlertTriangle className="hidden sm:block h-3 w-3 text-amber-500" />}
                  </div>

                  {/* Sales */}
                  <div className="sm:text-right text-xs text-muted-foreground font-medium">{product.sales}</div>

                  {/* Forecast */}
                  <div className="sm:text-right">
                    <ForecastChip days={forecast} />
                  </div>

                  {/* Action */}
                  <div className="sm:text-right flex sm:justify-end gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 px-2"
                      onClick={() => setAdjustingProduct(product)}>
                      <Edit2 className="h-3 w-3" /> Adjust
                    </Button>
                    {status === "out_of_stock" && (
                      <Button size="sm" className="h-7 text-[10px] gap-1 px-2"
                        onClick={() => setAdjustingProduct(product)}>
                        <Zap className="h-3 w-3" /> Restock
                      </Button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">No products match your filter</div>
          )}
        </div>
      </div>

      {/* Adjustment history panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h2 className="font-display font-bold text-sm flex items-center gap-2">
                <History className="h-4 w-4 text-brand-purple" /> Adjustment history
              </h2>
              <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-xl hover:bg-muted">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div>
              {history.slice(0, 10).map(adj => (
                <AdjHistoryRow key={adj.id} adj={adj} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adjust drawer */}
      {adjustingProduct && (
        <AdjustDrawer
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSave={handleAdjust}
        />
      )}

      {/* Bulk restock modal */}
      <AnimatePresence>
        {showBulkRestock && selectedProducts.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowBulkRestock(false)} />
            <BulkRestockModal
              products={selectedProducts}
              onClose={() => setShowBulkRestock(false)}
              onSave={handleBulkRestock}
            />
          </>
        )}
      </AnimatePresence>

      {/* Reorder rules panel */}
      <AnimatePresence>
        {showReorderPanel && (
          <ReorderPanel
            products={products}
            rules={reorderRules}
            onChange={setReorderRules}
            onClose={() => setShowReorderPanel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
