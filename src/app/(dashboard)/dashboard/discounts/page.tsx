"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Tag, Plus, Copy, CheckCheck, Trash2, Percent, Calendar, Users,
  TrendingUp, X, Share2, MessageCircle, Zap, BarChart2, Clock,
  ChevronDown, AlertCircle, Flame, RefreshCw, Filter, Search,
  ToggleLeft, ToggleRight, ArrowUpRight, Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { formatMoney, formatCompactMoney } from "@/lib/globalization"

const DISPLAY_CURRENCY = "USD"

// ── Types ─────────────────────────────────────────────────────────────────────

type DiscountType = "percentage" | "fixed"
type DiscountTarget = "all" | "new_customers" | "vip" | "specific_products"
type DiscountStatus = "active" | "inactive" | "scheduled" | "expired"

interface Discount {
  id: string
  code: string
  type: DiscountType
  value: number
  uses: number
  maxUses: number | null
  minOrder: number | null
  startsAt: string | null
  expires: string | null
  active: boolean
  target: DiscountTarget
  revenue: number
  isFlash: boolean
  flashEndsAt: string | null
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const DISCOUNTS_KEY = "lummy_discounts"

const DEFAULT_DISCOUNTS: Discount[] = [
  {
    id: "D1", code: "WELCOME10", type: "percentage", value: 10,
    uses: 47, maxUses: null, minOrder: null,
    startsAt: null, expires: null, active: true,
    target: "new_customers", revenue: 485000, isFlash: false, flashEndsAt: null,
  },
  {
    id: "D2", code: "SAVE5K", type: "fixed", value: 5000,
    uses: 12, maxUses: 50, minOrder: 20000,
    startsAt: null, expires: "2026-05-31", active: true,
    target: "all", revenue: 192000, isFlash: false, flashEndsAt: null,
  },
  {
    id: "D3", code: "SUMMER20", type: "percentage", value: 20,
    uses: 34, maxUses: 100, minOrder: null,
    startsAt: null, expires: "2026-06-15", active: true,
    target: "all", revenue: 680000, isFlash: false, flashEndsAt: null,
  },
  {
    id: "D4", code: "VIP25", type: "percentage", value: 25,
    uses: 8, maxUses: 20, minOrder: 50000,
    startsAt: null, expires: null, active: false,
    target: "vip", revenue: 320000, isFlash: false, flashEndsAt: null,
  },
  {
    id: "D5", code: "FLASH50", type: "percentage", value: 50,
    uses: 3, maxUses: 30, minOrder: null,
    startsAt: null, expires: null, active: true,
    target: "all", revenue: 75000, isFlash: true,
    flashEndsAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  },
]

function loadDiscounts(): Discount[] {
  if (typeof window === "undefined") return DEFAULT_DISCOUNTS
  try {
    const raw = localStorage.getItem(DISCOUNTS_KEY)
    if (raw) return JSON.parse(raw) as Discount[]
  } catch {}
  return DEFAULT_DISCOUNTS
}

function saveDiscounts(d: Discount[]) {
  try { localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(d)) } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return formatCompactMoney(n, DISPLAY_CURRENCY)
}

function getStatus(d: Discount): DiscountStatus {
  if (!d.active) return "inactive"
  if (d.expires && new Date(d.expires) < new Date()) return "expired"
  if (d.startsAt && new Date(d.startsAt) > new Date()) return "scheduled"
  return "active"
}

function buildPromoMessage(d: Discount): string {
  const discount = d.type === "percentage" ? `${d.value}% off` : `${formatMoney(d.value, DISPLAY_CURRENCY)} off`
  const min = d.minOrder ? ` on orders above ${formatMoney(d.minOrder, DISPLAY_CURRENCY)}` : ""
  const expiry = d.expires ? ` (expires ${new Date(d.expires).toLocaleDateString("en-GB", { day: "numeric", month: "short" })})` : ""
  const flash = d.isFlash ? "\n⏰ *FLASH SALE — Limited time only!*" : ""
  return `🎉 Special offer!\n\nUse code *${d.code}* to get ${discount}${min}${expiry}.${flash}\n\nShop now 👉 {storeUrl}\n\nDM to order! 💜`
}

function generateCode(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const suffix = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return prefix ? `${prefix.toUpperCase()}-${suffix}` : suffix
}

// ── Flash Countdown ───────────────────────────────────────────────────────────

function FlashCountdown({ endsAt }: { endsAt: string }) {
  const calc = () => {
    const diff = Math.max(0, new Date(endsAt).getTime() - Date.now())
    const h = Math.floor(diff / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    const s = Math.floor((diff % 60_000) / 1_000)
    return { h, m, s, done: diff === 0 }
  }
  const [time, setTime] = React.useState(calc)
  React.useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  })
  if (time.done) return <span className="text-[10px] text-brand-coral font-semibold">Ended</span>
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    <span className="flex items-center gap-1 text-[11px] font-bold text-brand-coral">
      <Flame className="h-3 w-3" />
      {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
    </span>
  )
}

// ── Stat Bar Chart ────────────────────────────────────────────────────────────

function RevenueBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / Math.max(max, 1)) * 100}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-indigo"
      />
    </div>
  )
}

// ── Create / Edit Modal ───────────────────────────────────────────────────────

const TARGET_OPTIONS: { value: DiscountTarget; label: string }[] = [
  { value: "all",               label: "All customers" },
  { value: "new_customers",     label: "New customers only" },
  { value: "vip",               label: "VIP customers" },
  { value: "specific_products", label: "Specific products" },
]

interface DiscountFormProps {
  initial?: Partial<Discount>
  onSave: (d: Omit<Discount, "id" | "uses" | "revenue">) => void
  onClose: () => void
}

function DiscountForm({ initial, onSave, onClose }: DiscountFormProps) {
  const [code, setCode] = React.useState(initial?.code ?? "")
  const [type, setType] = React.useState<DiscountType>(initial?.type ?? "percentage")
  const [value, setValue] = React.useState(initial?.value?.toString() ?? "")
  const [maxUses, setMaxUses] = React.useState(initial?.maxUses?.toString() ?? "")
  const [minOrder, setMinOrder] = React.useState(initial?.minOrder?.toString() ?? "")
  const [expires, setExpires] = React.useState(initial?.expires ?? "")
  const [startsAt, setStartsAt] = React.useState(initial?.startsAt ?? "")
  const [target, setTarget] = React.useState<DiscountTarget>(initial?.target ?? "all")
  const [isFlash, setIsFlash] = React.useState(initial?.isFlash ?? false)
  const [flashDuration, setFlashDuration] = React.useState("4")
  const [showAdvanced, setShowAdvanced] = React.useState(false)

  const valid = code.trim().length >= 3 && parseFloat(value) > 0

  const handleSave = () => {
    if (!valid) return
    const flashEndsAt = isFlash
      ? new Date(Date.now() + parseFloat(flashDuration) * 3_600_000).toISOString()
      : null
    onSave({
      code: code.trim().toUpperCase(),
      type, value: parseFloat(value),
      maxUses: maxUses ? parseInt(maxUses) : null,
      minOrder: minOrder ? parseInt(minOrder) : null,
      expires: expires || null, startsAt: startsAt || null,
      active: true, target, isFlash, flashEndsAt,
    })
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
        className="w-full sm:max-w-lg bg-card border border-border rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ maxHeight: "92vh" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-bold text-sm">{initial?.id ? "Edit Discount" : "Create Discount Code"}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: "calc(92vh - 140px)" }}>
          {/* Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Discount Code</label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. FLASH30"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono uppercase outline-none focus:border-brand-purple/50 transition-colors"
              />
              <button
                onClick={() => setCode(generateCode(""))}
                className="flex items-center gap-1.5 px-3 rounded-xl border border-border bg-background text-xs font-semibold hover:bg-accent transition-colors"
                title="Generate random code"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Generate
              </button>
            </div>
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Type</label>
              <div className="flex rounded-xl border border-border overflow-hidden">
                {([["percentage", "%"], ["fixed", "$"]] as const).map(([t, label]) => (
                  <button key={t} onClick={() => setType(t)} className={cn(
                    "flex-1 py-2.5 text-sm font-semibold transition-all",
                    type === t ? "bg-brand-purple text-white" : "text-muted-foreground hover:bg-accent"
                  )}>{label}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Value</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
                <input
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  min={1}
                  placeholder={type === "percentage" ? "10" : "5000"}
                  className="flex-1 text-sm bg-transparent outline-none"
                />
                <span className="text-xs text-muted-foreground">{type === "percentage" ? "%" : "$"}</span>
              </div>
            </div>
          </div>

          {/* Target */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Who can use this?</label>
            <div className="grid grid-cols-2 gap-2">
              {TARGET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTarget(opt.value)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all",
                    target === opt.value
                      ? "border-brand-purple/40 bg-brand-purple/8 text-brand-purple"
                      : "border-border text-muted-foreground hover:border-foreground/20"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Flash sale toggle */}
          <div className={cn("rounded-2xl border p-4 space-y-3 transition-all", isFlash ? "border-brand-coral/30 bg-brand-coral/5" : "border-border")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className={cn("h-4 w-4", isFlash ? "text-brand-coral" : "text-muted-foreground")} />
                <div>
                  <p className="text-xs font-bold">Flash Sale</p>
                  <p className="text-[10px] text-muted-foreground">Create urgency with a countdown timer</p>
                </div>
              </div>
              <button
                onClick={() => setIsFlash(!isFlash)}
                className={cn(
                  "relative h-5 w-9 rounded-full transition-all duration-200",
                  isFlash ? "bg-brand-coral" : "bg-muted"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
                  isFlash ? "translate-x-4" : "translate-x-0.5"
                )} />
              </button>
            </div>
            <AnimatePresence>
              {isFlash && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Duration</label>
                    <div className="flex gap-2">
                      {["1", "2", "4", "6", "12", "24"].map(h => (
                        <button
                          key={h}
                          onClick={() => setFlashDuration(h)}
                          className={cn(
                            "flex-1 rounded-lg py-1.5 text-[11px] font-semibold border transition-all",
                            flashDuration === h
                              ? "bg-brand-coral text-white border-brand-coral"
                              : "border-border text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Advanced settings */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAdvanced && "rotate-180")} />
            Advanced settings
          </button>
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Max uses</label>
                      <input
                        type="number"
                        value={maxUses}
                        onChange={e => setMaxUses(e.target.value)}
                        placeholder="Unlimited"
                        min={1}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-purple/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Min order ({DISPLAY_CURRENCY})</label>
                      <input
                        type="number"
                        value={minOrder}
                        onChange={e => setMinOrder(e.target.value)}
                        placeholder="No minimum"
                        min={0}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-purple/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Start date</label>
                      <input
                        type="date"
                        value={startsAt}
                        onChange={e => setStartsAt(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-purple/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Expiry date</label>
                      <input
                        type="date"
                        value={expires}
                        onChange={e => setExpires(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-purple/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            {initial?.id ? "Save Changes" : "Create Code"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Discount Card ─────────────────────────────────────────────────────────────

const statusConfig = {
  active:    { label: "Active",    className: "bg-brand-green/10 text-brand-green border-brand-green/20" },
  inactive:  { label: "Inactive",  className: "bg-muted text-muted-foreground border-border" },
  scheduled: { label: "Scheduled", className: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20" },
  expired:   { label: "Expired",   className: "bg-brand-coral/10 text-brand-coral border-brand-coral/20" },
} as const

const targetConfig: Record<DiscountTarget, string> = {
  all:               "All customers",
  new_customers:     "New customers",
  vip:               "VIP only",
  specific_products: "Specific products",
}

interface DiscountCardProps {
  discount: Discount
  maxRevenue: number
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onCopy: () => void
  copied: boolean
}

function DiscountCard({ discount: d, maxRevenue, onToggle, onEdit, onDelete, onCopy, copied }: DiscountCardProps) {
  const [showShare, setShowShare] = React.useState(false)
  const status = getStatus(d)
  const cfg = statusConfig[status]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        "rounded-2xl border bg-card p-4 space-y-3 transition-all",
        status === "expired" && "opacity-60",
        d.isFlash && status === "active" && "border-brand-coral/30"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {d.isFlash && status === "active" && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-coral/15 text-brand-coral border border-brand-coral/20">
                <Flame className="h-2.5 w-2.5" /> FLASH
              </span>
            )}
            <code className="font-mono text-sm font-extrabold tracking-wider text-brand-purple">{d.code}</code>
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", cfg.className)}>{cfg.label}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Percent className="h-3 w-3" />
              {d.type === "percentage" ? `${d.value}% off` : `${formatMoney(d.value, DISPLAY_CURRENCY)} off`}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {targetConfig[d.target]}
            </span>
            {d.minOrder && <span>Min {formatCompactMoney(d.minOrder, DISPLAY_CURRENCY)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={onCopy} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors" title="Copy code">
            {copied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title={d.active ? "Deactivate" : "Activate"}>
            {d.active ? <ToggleRight className="h-5 w-5 text-brand-purple" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Flash countdown */}
      {d.isFlash && d.flashEndsAt && status === "active" && (
        <div className="flex items-center gap-2 rounded-xl bg-brand-coral/5 border border-brand-coral/15 px-3 py-2">
          <Clock className="h-3.5 w-3.5 text-brand-coral flex-shrink-0" />
          <span className="text-[11px] text-muted-foreground flex-1">Ends in</span>
          <FlashCountdown endsAt={d.flashEndsAt} />
        </div>
      )}

      {/* Usage progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">{d.uses} uses{d.maxUses ? ` of ${d.maxUses}` : ""}</span>
          {d.maxUses && (
            <span className={cn(
              "font-semibold",
              d.uses / d.maxUses > 0.8 ? "text-brand-coral" : d.uses / d.maxUses > 0.5 ? "text-amber-500" : "text-brand-green"
            )}>
              {d.maxUses - d.uses} left
            </span>
          )}
        </div>
        {d.maxUses && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((d.uses / d.maxUses) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                d.uses / d.maxUses > 0.8 ? "bg-brand-coral" :
                d.uses / d.maxUses > 0.5 ? "bg-amber-500" : "bg-brand-green"
              )}
            />
          </div>
        )}
      </div>

      {/* Revenue bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1 text-muted-foreground"><TrendingUp className="h-3 w-3" />Revenue generated</span>
          <span className="font-semibold text-brand-green">{formatCurrency(d.revenue)}</span>
        </div>
        <RevenueBar value={d.revenue} max={maxRevenue} />
      </div>

      {/* Expiry */}
      {d.expires && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          Expires {new Date(d.expires).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      )}

      {/* WhatsApp share panel */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp promo message</p>
              <p className="text-xs whitespace-pre-line leading-relaxed text-foreground">{buildPromoMessage(d)}</p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => { navigator.clipboard.writeText(buildPromoMessage(d)); toast({ title: "Message copied!" }) }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-brand-purple hover:underline"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(buildPromoMessage(d))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#25D366] hover:underline"
                >
                  <MessageCircle className="h-3 w-3" /> Open WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action row */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={() => setShowShare(!showShare)}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
            showShare ? "bg-[#25D366]/15 text-[#25D366]" : "border border-border hover:bg-accent"
          )}
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-accent transition-all"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="ml-auto p-2 rounded-xl border border-border text-muted-foreground hover:text-brand-coral hover:border-brand-coral/30 hover:bg-brand-coral/5 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

// ── Analytics Panel ───────────────────────────────────────────────────────────

function AnalyticsPanel({ discounts }: { discounts: Discount[] }) {
  const totalUses = discounts.reduce((s, d) => s + d.uses, 0)
  const totalRevenue = discounts.reduce((s, d) => s + d.revenue, 0)
  const topCode = [...discounts].sort((a, b) => b.revenue - a.revenue)[0]
  const conversionRate = discounts.length > 0
    ? Math.round((discounts.filter(d => d.uses > 0).length / discounts.length) * 100)
    : 0

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-brand-purple" />
        <p className="text-sm font-bold">Performance Overview</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total Uses", value: totalUses.toLocaleString(), color: "text-brand-purple" },
          { label: "Revenue from codes", value: formatCurrency(totalRevenue), color: "text-brand-green" },
          { label: "Active codes", value: discounts.filter(d => getStatus(d) === "active").length, color: "text-brand-indigo" },
          { label: "Code adoption", value: `${conversionRate}%`, color: "text-amber-500" },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-muted/40 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className={cn("text-lg font-bold mt-0.5", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>
      {topCode && (
        <div className="rounded-xl border border-brand-purple/15 bg-brand-purple/5 p-3 flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-brand-purple flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-brand-purple">Top performer</p>
            <p className="text-[11px] text-muted-foreground"><code className="font-mono font-bold text-foreground">{topCode.code}</code> · {formatCurrency(topCode.revenue)} revenue · {topCode.uses} uses</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type FilterTab = "all" | "active" | "flash" | "expired"

export default function DiscountsPage() {
  const [discounts, setDiscounts] = React.useState<Discount[]>([])
  const [showForm, setShowForm] = React.useState(false)
  const [editingDiscount, setEditingDiscount] = React.useState<Discount | null>(null)
  const [filter, setFilter] = React.useState<FilterTab>("all")
  const [search, setSearch] = React.useState("")
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [showAnalytics, setShowAnalytics] = React.useState(false)

  React.useEffect(() => { setDiscounts(loadDiscounts()) }, [])

  const persist = (next: Discount[]) => { setDiscounts(next); saveDiscounts(next) }

  const handleCreate = (data: Omit<Discount, "id" | "uses" | "revenue">) => {
    const next = [...discounts, { ...data, id: `D${Date.now()}`, uses: 0, revenue: 0 }]
    persist(next)
    setShowForm(false)
    toast({ title: "Discount created", description: `Code ${data.code} is ready to use.`, variant: "success" })
  }

  const handleUpdate = (data: Omit<Discount, "id" | "uses" | "revenue">) => {
    if (!editingDiscount) return
    const next = discounts.map(d => d.id === editingDiscount.id ? { ...d, ...data } : d)
    persist(next)
    setEditingDiscount(null)
    toast({ title: "Discount updated" })
  }

  const handleToggle = (id: string) => {
    const next = discounts.map(d => d.id === id ? { ...d, active: !d.active } : d)
    persist(next)
    const d = next.find(x => x.id === id)!
    toast({ title: d.active ? "Code activated" : "Code deactivated" })
  }

  const handleDelete = (id: string) => {
    const code = discounts.find(d => d.id === id)?.code
    persist(discounts.filter(d => d.id !== id))
    setDeleteId(null)
    toast({ title: `${code} deleted` })
  }

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({ title: "Code copied!", description: `${code} copied to clipboard.`, variant: "success" })
  }

  const maxRevenue = Math.max(...discounts.map(d => d.revenue), 1)

  const filtered = discounts
    .filter(d => {
      if (search) return d.code.toLowerCase().includes(search.toLowerCase())
      const status = getStatus(d)
      if (filter === "active") return status === "active"
      if (filter === "flash") return d.isFlash && status === "active"
      if (filter === "expired") return status === "expired" || status === "inactive"
      return true
    })

  const activeCount = discounts.filter(d => getStatus(d) === "active").length
  const flashCount = discounts.filter(d => d.isFlash && getStatus(d) === "active").length

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Discounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage promotional codes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
              showAnalytics ? "bg-brand-purple/10 border-brand-purple/30 text-brand-purple" : "border-border hover:bg-accent"
            )}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Analytics
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-purple px-4 py-2 text-xs font-bold text-white hover:bg-brand-purple/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Code
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Codes",    value: activeCount,                                                  icon: Tag,       color: "text-brand-purple", bg: "bg-brand-purple/10" },
          { label: "Flash Sales",     value: flashCount,                                                   icon: Flame,     color: "text-brand-coral",  bg: "bg-brand-coral/10" },
          { label: "Total Uses",      value: discounts.reduce((s, d) => s + d.uses, 0),                   icon: Users,     color: "text-brand-indigo", bg: "bg-brand-indigo/10" },
          { label: "Revenue via codes",value: formatCurrency(discounts.reduce((s, d) => s + d.revenue, 0)), icon: TrendingUp, color: "text-brand-green",  bg: "bg-brand-green/10" },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <div className={cn("rounded-xl p-2", s.bg)}>
                <Icon className={cn("h-4 w-4", s.color)} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                <p className="text-base font-bold">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Analytics panel */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <AnalyticsPanel discounts={discounts} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash sale tip */}
      {flashCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-brand-coral/20 bg-brand-coral/5 px-4 py-3"
        >
          <Flame className="h-4 w-4 text-brand-coral flex-shrink-0" />
          <p className="text-xs font-semibold text-brand-coral flex-1">
            {flashCount} flash sale{flashCount > 1 ? "s" : ""} running — share via WhatsApp to maximise reach
          </p>
          <button
            onClick={() => setFilter("flash")}
            className="flex items-center gap-1 text-[11px] font-bold text-brand-coral hover:underline flex-shrink-0"
          >
            View <ArrowUpRight className="h-3 w-3" />
          </button>
        </motion.div>
      )}

      {/* Filter + search row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          {(["all", "active", "flash", "expired"] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setSearch("") }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                filter === f && !search ? "bg-brand-purple text-white" : "text-muted-foreground hover:bg-accent"
              )}
            >
              {f === "flash" ? (
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  Flash
                  {flashCount > 0 && <span className="ml-0.5 text-[10px] bg-brand-coral/20 text-brand-coral px-1 rounded-full">{flashCount}</span>}
                </span>
              ) : (
                f === "all" ? `All (${discounts.length})` : f.charAt(0).toUpperCase() + f.slice(1)
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1 rounded-xl border border-border bg-background px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by code…"
            className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
          />
          {search && <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
        </div>
      </div>

      {/* Discount cards */}
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(d => (
              <DiscountCard
                key={d.id}
                discount={d}
                maxRevenue={maxRevenue}
                onToggle={() => handleToggle(d.id)}
                onEdit={() => setEditingDiscount(d)}
                onDelete={() => setDeleteId(d.id)}
                onCopy={() => copyCode(d.code, d.id)}
                copied={copiedId === d.id}
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
              <Tag className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">No discount codes found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? `No codes match "${search}"` : "Create your first discount code to start attracting customers."}
            </p>
            {!search && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 flex items-center gap-2 rounded-xl bg-brand-purple px-4 py-2 text-xs font-semibold text-white hover:bg-brand-purple/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Create first code
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash sale CTA */}
      {flashCount === 0 && filter === "all" && !search && discounts.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-brand-coral/30 bg-brand-coral/3 px-4 py-3.5">
          <Zap className="h-4 w-4 text-brand-coral flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold">No active flash sales</p>
            <p className="text-[11px] text-muted-foreground">Flash sales with countdown timers boost urgency and conversion by up to 30%.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-coral/10 text-brand-coral px-3 py-2 text-xs font-semibold hover:bg-brand-coral/20 transition-colors flex-shrink-0"
          >
            <Flame className="h-3.5 w-3.5" />
            Create flash
          </button>
        </div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
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
                  <p className="text-sm font-bold">Delete <code className="font-mono">{discounts.find(d => d.id === deleteId)?.code}</code>?</p>
                  <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDeleteId(null)} className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold hover:bg-accent transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 rounded-xl bg-brand-coral py-2.5 text-xs font-semibold text-white hover:bg-brand-coral/90 transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showForm && <DiscountForm onSave={handleCreate} onClose={() => setShowForm(false)} />}
        {editingDiscount && <DiscountForm initial={editingDiscount} onSave={handleUpdate} onClose={() => setEditingDiscount(null)} />}
      </AnimatePresence>
    </div>
  )
}
