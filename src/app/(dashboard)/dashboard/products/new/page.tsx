"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, ChevronRight, ImagePlus, Sparkles, Loader2,
  MessageCircle, Check, ShoppingBag, Eye, TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { formatMoney } from "@/lib/globalization"

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Clothing", "Jewellery", "Accessories", "Beauty",
  "Footwear", "Food", "Art", "Digital", "Services", "Other",
]

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "One Size"]

const COLOR_OPTIONS = [
  { name: "Black",  hex: "#111111" },
  { name: "White",  hex: "#F5F5F5" },
  { name: "Red",    hex: "#EF4444" },
  { name: "Blue",   hex: "#3B82F6" },
  { name: "Green",  hex: "#22C55E" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Pink",   hex: "#EC4899" },
  { name: "Purple", hex: "#6C4EF3" },
  { name: "Brown",  hex: "#92400E" },
  { name: "Orange", hex: "#F97316" },
]

const AI_DESCRIPTIONS: Record<string, string> = {
  clothing:     "Elevate your wardrobe with this stunning piece. Crafted from high-quality fabric, it offers a flattering fit and timeless style. Available in multiple sizes — perfect for everyday wear or special occasions.",
  jewellery:    "Handcrafted with care, this exquisite jewellery piece adds elegance to any outfit. Made from premium materials with intricate detailing. A perfect gift or a luxurious treat for yourself.",
  accessories:  "A must-have accessory that completes any look. Crafted with attention to detail and built to last. Stylish, functional, and versatile — the perfect finishing touch.",
  beauty:       "Transform your beauty routine with this premium product. Formulated with the finest ingredients to deliver visible results. Gentle on skin and packed with nourishing benefits.",
  footwear:     "Step out in style with this premium footwear. Designed for comfort and crafted for durability, these shoes blend fashion with function effortlessly.",
  food:         "Taste the difference with this artisanal delicacy. Made from fresh, locally-sourced ingredients with no artificial preservatives. A treat you can feel good about.",
  art:          "Own a one-of-a-kind piece that tells a story. This original artwork is crafted with passion and precision — perfect for collectors and art lovers alike.",
  digital:      "Unlock instant value with this premium digital product. Professionally designed, immediately downloadable, and packed with everything you need to level up.",
  services:     "Experience top-tier service delivered with care and expertise. Whether remote or in-person, expect professional results and full satisfaction guaranteed.",
  default:      "A beautifully crafted piece made with premium materials. Designed for comfort and style, this item is perfect for any occasion. Each piece is carefully quality-checked before shipping.",
}

const STEPS = [
  { id: 1, label: "Product Info",     description: "Name, category & image" },
  { id: 2, label: "Details",          description: "Description & variants" },
  { id: 3, label: "Pricing",          description: "Price, stock & settings" },
]

const PRODUCT_DRAFT_KEY = "lummy_product_draft"

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string
  category: string
  imageUrl: string
  description: string
  sizes: string[]
  colors: string[]
  price: string
  stock: string
  status: "active" | "draft" | "sold_out"
  whatsappEnabled: boolean
}

type ProductDraft = {
  step: number
  form: FormState
  savedAt?: string
}

const initial: FormState = {
  name: "",
  category: "Clothing",
  imageUrl: "",
  description: "",
  sizes: [],
  colors: [],
  price: "",
  stock: "",
  status: "active",
  whatsappEnabled: true,
}

function normalizeProductDraft(value: unknown): ProductDraft | null {
  if (!value || typeof value !== "object") return null
  const draft = value as Partial<ProductDraft>
  if (!draft.form || typeof draft.form !== "object") return null
  return {
    step: Math.min(Math.max(Number(draft.step) || 1, 1), STEPS.length),
    form: { ...initial, ...draft.form },
    savedAt: draft.savedAt,
  }
}

function formatSavedAt(value: string | null) {
  if (!value) return "Draft autosave enabled"

  try {
    const saved = new Date(value).getTime()

    if (Number.isNaN(saved)) {
      return "Draft autosave enabled"
    }

    const diff = Math.max(0, Date.now() - saved)
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "Last saved just now"
    if (minutes === 1) return "Last saved 1 min ago"

    return `Last saved ${minutes} mins ago`
  } catch {
    return "Draft autosave enabled"
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold mb-2">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

const inputCls = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30 transition-shadow"

function StepDot({ step, current }: { step: number; current: number }) {
  const done = step < current
  const active = step === current
  return (
    <div className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300",
      done    ? "bg-brand-purple border-brand-purple text-white" :
      active  ? "bg-background border-brand-purple text-brand-purple" :
                "bg-background border-border text-muted-foreground"
    )}>
      {done ? <Check className="h-4 w-4" /> : step}
    </div>
  )
}

// ─── Live Preview Card ─────────────────────────────────────────────────────────

function ProductPreviewCard({ form }: { form: FormState }) {
  const price = Number(form.price) || 0
  const statusConfig = {
    active:   { label: "Active",   cls: "bg-brand-green/10 text-brand-green border-brand-green/20" },
    draft:    { label: "Draft",    cls: "bg-muted text-muted-foreground border-border" },
    sold_out: { label: "Sold Out", cls: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  }
  const status = statusConfig[form.status]

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Image */}
      <div className="relative h-52 bg-muted flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {form.imageUrl ? (
            <motion.div key={form.imageUrl} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }} className="absolute inset-0">
              <Image src={form.imageUrl} alt="preview" fill className="object-cover" unoptimized />
            </motion.div>
          ) : (
            <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 text-muted-foreground/40">
              <ImagePlus className="h-10 w-10" />
              <span className="text-xs">Image preview</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm", status.cls)}>
            {status.label}
          </span>
        </div>

        {/* WhatsApp badge */}
        {form.whatsappEnabled && (
          <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366]/20 border border-[#25D366]/30 backdrop-blur-sm">
            <MessageCircle className="w-3 h-3 text-[#25D366]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{form.name || <span className="text-muted-foreground/50 font-normal italic">Product name…</span>}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{form.category}</p>
          </div>
          <p className="font-display font-bold text-sm text-brand-purple flex-shrink-0">
            {price > 0 ? formatMoney(price) : "—"}
          </p>
        </div>

        {form.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{form.description}</p>
        )}

        {/* Variants */}
        {(form.sizes.length > 0 || form.colors.length > 0) && (
          <div className="mt-3 pt-3 border-t border-border space-y-1.5">
            {form.sizes.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {form.sizes.map(s => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted border border-border font-medium">{s}</span>
                ))}
              </div>
            )}
            {form.colors.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {COLOR_OPTIONS.filter(c => form.colors.includes(c.name)).map(c => (
                  <div key={c.name} className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: c.hex }} title={c.name} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-3 pt-3 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" /><span>0 sales</span></div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1"><Eye className="w-3 h-3" /><span>0 views</span></div>
          <div className="ml-auto flex items-center gap-1 text-brand-green"><TrendingUp className="w-3 h-3" /><span>$0</span></div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 1: Product Info ──────────────────────────────────────────────────────

function Step1({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }))

  return (
    <motion.div key="step1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}
      className="space-y-6">
      {/* Image URL */}
      <div>
        <FieldLabel>Product image</FieldLabel>
        <div className="relative rounded-2xl overflow-hidden bg-muted border border-border h-52 mb-3 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {form.imageUrl ? (
              <motion.div key={form.imageUrl} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                className="absolute inset-0">
                <Image src={form.imageUrl} alt="preview" fill className="object-cover" unoptimized />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2.5 text-muted-foreground/50">
                <ImagePlus className="h-10 w-10" />
                <p className="text-sm">Paste an image URL below to preview</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)}
          placeholder="https://example.com/product-image.jpg"
          className={inputCls} />
        <p className="text-xs text-muted-foreground mt-1.5">Paste a public image URL. We&apos;ll show a live preview above.</p>
      </div>

      {/* Product name */}
      <div>
        <FieldLabel required>Product name</FieldLabel>
        <input value={form.name} onChange={e => set("name", e.target.value)}
          placeholder="e.g. Ankara Print Dress"
          className={inputCls} />
      </div>

      {/* Category */}
      <div>
        <FieldLabel>Category</FieldLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => set("category", c)}
              className={cn(
                "h-10 px-3 rounded-xl border text-sm font-medium transition-all text-left",
                form.category === c
                  ? "bg-brand-purple/10 border-brand-purple/40 text-brand-purple font-semibold"
                  : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              )}>
              {c}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Step 2: Details ──────────────────────────────────────────────────────────

function Step2({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const [aiGenerating, setAiGenerating] = React.useState(false)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }))

  const toggleSize = (s: string) =>
    setForm(f => ({ ...f, sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s] }))

  const toggleColor = (c: string) =>
    setForm(f => ({ ...f, colors: f.colors.includes(c) ? f.colors.filter(x => x !== c) : [...f.colors, c] }))

  const generateDescription = () => {
    if (!form.name) { toast({ title: "Enter a product name first", variant: "default" }); return }
    if (intervalRef.current) clearInterval(intervalRef.current)
    setAiGenerating(true)
    const cat = form.category.toLowerCase()
    const base = AI_DESCRIPTIONS[cat] ?? AI_DESCRIPTIONS.default
    const full = `✨ ${form.name}\n\n${base}`
    let i = 0
    setForm(f => ({ ...f, description: "" }))
    intervalRef.current = setInterval(() => {
      i++
      setForm(f => ({ ...f, description: full.slice(0, i) }))
      if (i >= full.length) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        setAiGenerating(false)
      }
    }, 16)
  }

  React.useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  return (
    <motion.div key="step2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}
      className="space-y-6">
      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <FieldLabel>Description</FieldLabel>
          <button onClick={generateDescription} disabled={aiGenerating}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-purple hover:text-brand-purple/80 transition-colors disabled:opacity-60">
            {aiGenerating
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating…</>
              : <><Sparkles className="h-3.5 w-3.5" />Generate with AI</>}
          </button>
        </div>
        <textarea value={form.description} onChange={e => set("description", e.target.value)}
          placeholder="Describe your product… or click Generate with AI ✨"
          rows={5}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30 leading-relaxed transition-shadow" />
        {form.description && (
          <p className="text-[10px] text-muted-foreground mt-1">{form.description.length} characters</p>
        )}
      </div>

      {/* Sizes */}
      <div>
        <FieldLabel>Sizes <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map(s => (
            <button key={s} onClick={() => toggleSize(s)}
              className={cn(
                "h-9 px-3.5 rounded-xl border text-sm font-semibold transition-all",
                form.sizes.includes(s)
                  ? "bg-brand-purple text-white border-brand-purple shadow-sm"
                  : "border-border text-muted-foreground hover:border-brand-purple/30 hover:text-foreground"
              )}>
              {s}
            </button>
          ))}
        </div>
        {form.sizes.length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-2">Selected: {form.sizes.join(", ")}</p>
        )}
      </div>

      {/* Colors */}
      <div>
        <FieldLabel>Colours <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
        <div className="flex flex-wrap gap-3">
          {COLOR_OPTIONS.map(c => (
            <button key={c.name} onClick={() => toggleColor(c.name)} title={c.name}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                form.colors.includes(c.name)
                  ? "border-brand-purple scale-110 ring-2 ring-brand-purple/30"
                  : "border-border hover:border-brand-purple/40 hover:scale-105"
              )}
              style={{ backgroundColor: c.hex }}>
              {form.colors.includes(c.name) && (
                <Check className="h-3.5 w-3.5" style={{ color: c.hex === "#F5F5F5" ? "#111" : "#fff" }} />
              )}
            </button>
          ))}
        </div>
        {form.colors.length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-2">Selected: {form.colors.join(", ")}</p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Step 3: Pricing & Settings ───────────────────────────────────────────────

function Step3({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }))

  return (
    <motion.div key="step3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}
      className="space-y-6">
      {/* Price + Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Price ($)</FieldLabel>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">$</span>
            <input value={form.price} onChange={e => set("price", e.target.value.replace(/\D/g, ""))}
              placeholder="18000"
              className={cn(inputCls, "pl-7")} />
          </div>
        </div>
        <div>
          <FieldLabel>Stock quantity</FieldLabel>
          <input value={form.stock} onChange={e => set("stock", e.target.value.replace(/\D/g, ""))}
            placeholder="∞ unlimited"
            className={inputCls} />
        </div>
      </div>

      {/* Status */}
      <div>
        <FieldLabel>Listing status</FieldLabel>
        <div className="grid grid-cols-3 gap-2.5">
          {(["active", "draft", "sold_out"] as const).map(s => (
            <button key={s} onClick={() => set("status", s)}
              className={cn(
                "h-11 rounded-xl border text-sm font-semibold capitalize transition-all",
                form.status === s
                  ? s === "active"   ? "bg-brand-green/10 border-brand-green/40 text-brand-green"
                  : s === "draft"    ? "bg-muted border-foreground/20 text-foreground"
                                     : "bg-amber-500/10 border-amber-500/40 text-amber-500"
                  : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              )}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {form.status === "active"   ? "Visible and available in your store." :
           form.status === "draft"    ? "Hidden from your store. You can publish later." :
                                       "Visible but marked as sold out."}
        </p>
      </div>

      {/* WhatsApp ordering */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="h-4.5 w-4.5 text-[#25D366]" />
          </div>
          <div>
            <p className="text-sm font-semibold">WhatsApp ordering</p>
            <p className="text-xs text-muted-foreground">Show &quot;Order via WhatsApp&quot; button on this product</p>
          </div>
        </div>
        <button onClick={() => set("whatsappEnabled", !form.whatsappEnabled)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 flex-shrink-0",
            form.whatsappEnabled ? "bg-[#25D366]" : "bg-muted-foreground/30"
          )}>
          <span className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300",
            form.whatsappEnabled ? "translate-x-6" : "translate-x-1"
          )} />
        </button>
      </div>

      {/* Summary box */}
      <div className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-4">
        <p className="text-sm font-semibold text-brand-purple mb-3">Ready to publish?</p>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Product name</span>
            <span className="font-medium text-foreground truncate max-w-[160px]">{form.name || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Category</span>
            <span className="font-medium text-foreground">{form.category}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Price</span>
            <span className="font-medium text-brand-purple">{form.price ? formatMoney(Number(form.price)) : "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Stock</span>
            <span className="font-medium text-foreground">{form.stock || "Unlimited"}</span>
          </div>
          {form.sizes.length > 0 && (
            <div className="flex items-center justify-between">
              <span>Sizes</span>
              <span className="font-medium text-foreground">{form.sizes.join(", ")}</span>
            </div>
          )}
          {form.colors.length > 0 && (
            <div className="flex items-center justify-between">
              <span>Colours</span>
              <span className="font-medium text-foreground">{form.colors.join(", ")}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewProductPage() {
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const [hydrated, setHydrated] = React.useState(false)
  const [userId, setUserId] = React.useState<string | null>(null)
  const [continuityRow, setContinuityRow] = React.useState<{
    current_step?: string | null
    completed?: boolean
    organization_id?: string | null
    metadata?: Record<string, unknown>
  }>({})
  const [step, setStep] = React.useState(1)
  const [form, setForm] = React.useState<FormState>(initial)
  const [saving, setSaving] = React.useState(false)
  const [restored, setRestored] = React.useState(false)
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null)
  const autosaveTimeoutRef = React.useRef<number | null>(null)
  const draftFinalizedRef = React.useRef(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return

    let cancelled = false

    async function restoreDraft() {
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        setHydrated(true)
        return
      }

      setUserId(auth.user.id)

      const { data: state } = await supabase
        .from("onboarding_states")
        .select("current_step, completed, organization_id, metadata, updated_at")
        .eq("user_id", auth.user.id)
        .maybeSingle()

      if (cancelled) return

      const metadata = (state?.metadata ?? {}) as Record<string, unknown>
      setContinuityRow({
        current_step: state?.current_step,
        completed: state?.completed,
        organization_id: state?.organization_id,
        metadata,
      })

      let localDraft: ProductDraft | null = null
      try {
        localDraft = normalizeProductDraft(JSON.parse(localStorage.getItem(PRODUCT_DRAFT_KEY) ?? "null"))
      } catch {
        localDraft = null
      }

      const dbDraft = normalizeProductDraft(metadata.product_draft)
      const dbTime = dbDraft?.savedAt ? new Date(dbDraft.savedAt).getTime() : 0
      const localTime = localDraft?.savedAt ? new Date(localDraft.savedAt).getTime() : 0
      const nextDraft = dbTime >= localTime ? dbDraft ?? localDraft : localDraft ?? dbDraft

      if (nextDraft) {
        setStep(nextDraft.step)
        setForm(nextDraft.form)
        setLastSavedAt(nextDraft.savedAt ?? null)
        setRestored(Object.values(nextDraft.form).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value)))
      }

      setHydrated(true)
    }

    void restoreDraft()

    return () => {
      cancelled = true
    }
  }, [mounted])

  React.useEffect(() => {
    if (!mounted || !hydrated || !userId || draftFinalizedRef.current) return

    const savedAt = new Date().toISOString()
    const productDraft = { step, form, savedAt }
    try {
      localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(productDraft))
    } catch { /* ignore */ }

    if (autosaveTimeoutRef.current) window.clearTimeout(autosaveTimeoutRef.current)
    autosaveTimeoutRef.current = window.setTimeout(() => {
      if (draftFinalizedRef.current) return
      const supabase = createClient()
      const metadata = {
        ...(continuityRow.metadata ?? {}),
        product_draft: productDraft,
      }

      void supabase.from("onboarding_states").upsert(
        {
          user_id: userId,
          organization_id: continuityRow.organization_id ?? null,
          current_step: continuityRow.current_step ?? "completed",
          completed: continuityRow.completed ?? true,
          metadata,
          updated_at: savedAt,
        },
        { onConflict: "user_id" },
      ).then(({ error }) => {
        if (!error) {
          setLastSavedAt(savedAt)
        }
      })
    }, 700)

    return () => {
      if (autosaveTimeoutRef.current) window.clearTimeout(autosaveTimeoutRef.current)
    }
  }, [continuityRow.completed, continuityRow.current_step, continuityRow.metadata, continuityRow.organization_id, form, hydrated, mounted, step, userId])

  const canNext =
    step === 1 ? form.name.trim().length > 0 :
    step === 2 ? true :
    form.price.trim().length > 0

  const handleNext = () => { if (step < 3) setStep(s => s + 1) }
  const handleBack = () => { if (step > 1) setStep(s => s - 1) }

  const handleSave = () => {
    draftFinalizedRef.current = true
    if (autosaveTimeoutRef.current) window.clearTimeout(autosaveTimeoutRef.current)
    setSaving(true)
    setTimeout(async () => {
      setSaving(false)
      toast({
        title: form.status === "draft" ? "Product saved as draft" : "Product published!",
        description: `"${form.name}" is ${form.status === "draft" ? "saved as a draft" : "now live in your store"}.`,
        variant: "success",
      })
      try { localStorage.removeItem(PRODUCT_DRAFT_KEY) } catch { /* ignore */ }
      if (userId) {
        const supabase = createClient()
        const metadata = { ...(continuityRow.metadata ?? {}) }
        delete metadata.product_draft
        await supabase.from("onboarding_states").upsert(
          {
            user_id: userId,
            organization_id: continuityRow.organization_id ?? null,
            current_step: continuityRow.current_step ?? "completed",
            completed: continuityRow.completed ?? true,
            metadata,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )
        setContinuityRow((row) => ({ ...row, metadata }))
      }
      router.push("/dashboard/products")
    }, 1000)
  }

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100

  if (!mounted || !hydrated) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-4 px-4 sm:px-6 h-14 max-w-[1200px] mx-auto">
          <Link href="/dashboard/products"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex-1">
            <h1 className="font-display font-bold text-base">Add new product</h1>
            <p className="text-[10px] text-muted-foreground">{formatSavedAt(lastSavedAt)}</p>
          </div>
          <p className="text-xs text-muted-foreground flex-shrink-0">
            Step {step} of {STEPS.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-muted">
          <motion.div
            className="h-full bg-brand-purple"
            animate={{ width: `${progressPct === 0 ? 8 : progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        {restored && (
          <div className="mb-5 rounded-xl border border-brand-purple/20 bg-brand-purple/10 px-3 py-2 text-xs font-medium text-brand-purple">
            Draft restored
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

          {/* Left: Form */}
          <div>
            {/* Step indicators */}
            <div className="flex items-center gap-0 mb-8">
              {STEPS.map((s, i) => (
                <React.Fragment key={s.id}>
                  <button
                    onClick={() => { if (s.id < step || (s.id === step + 1 && canNext)) setStep(s.id) }}
                    disabled={s.id > step && !(s.id === step + 1 && canNext)}
                    className="flex items-center gap-2.5 group disabled:pointer-events-none"
                  >
                    <StepDot step={s.id} current={step} />
                    <div className="hidden sm:block text-left">
                      <p className={cn("text-xs font-bold transition-colors", step === s.id ? "text-foreground" : "text-muted-foreground")}>{s.label}</p>
                      <p className="text-[10px] text-muted-foreground">{s.description}</p>
                    </div>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={cn("flex-1 h-px mx-3 transition-colors", s.id < step ? "bg-brand-purple" : "bg-border")} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step content */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-6">
                <h2 className="font-display font-bold text-xl">{STEPS[step - 1].label}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{STEPS[step - 1].description}</p>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && <Step1 key="1" form={form} setForm={setForm} />}
                {step === 2 && <Step2 key="2" form={form} setForm={setForm} />}
                {step === 3 && <Step3 key="3" form={form} setForm={setForm} />}
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-5">
              <Button variant="outline" onClick={handleBack} disabled={step === 1} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>

              {step < 3 ? (
                <Button onClick={handleNext} disabled={!canNext} className="gap-2">
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setForm(f => ({ ...f, status: "draft" })); handleSave() }}
                    disabled={!canNext || saving}>
                    Save as draft
                  </Button>
                  <Button onClick={handleSave} disabled={!canNext || saving} className="gap-2 min-w-[120px]">
                    {saving
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Publishing…</>
                      : <><Check className="h-4 w-4" />Publish product</>}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live preview (desktop only) */}
          <div className="hidden lg:block sticky top-20">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Live preview</p>
            <ProductPreviewCard form={form} />
            <p className="text-[10px] text-muted-foreground text-center mt-3">
              This is how your product will appear in your store
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
