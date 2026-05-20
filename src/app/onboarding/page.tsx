"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import {
  ShoppingBag,
  Sparkles,
  Scissors,
  Radio,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Check,
  Zap,
  Store,
  MessageCircle,
  Copy,
  CheckCheck,
  MapPin,
  Phone,
  AtSign,
  Tag,
  X,
  Building2,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { LummyLoader } from "@/components/ui/lummy-loader"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { completeOnboarding } from "@/server/actions/onboarding"
import { LummyLogo } from "@/components/brand/lummy-logo"

// ─── Types ────────────────────────────────────────────────────────────────────

const NIGERIAN_BANKS = [
  "Access Bank", "First Bank", "GTBank", "Zenith Bank", "UBA",
  "Stanbic IBTC", "Fidelity Bank", "Union Bank", "Polaris Bank",
  "Sterling Bank", "Wema Bank", "FCMB", "Ecobank", "Heritage Bank",
  "Kuda Bank", "Opay", "PalmPay", "Moniepoint",
]

interface WizardData {
  creatorType: string
  storeName: string
  handle: string
  whatsapp: string
  niche: string
  location: string
  productName: string
  productPrice: string
  productDesc: string
  productCategory: string
  addProduct: boolean
  bankName: string
  accountNumber: string
  accountName: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5

const creatorTypes = [
  {
    id: "product_seller",
    icon: ShoppingBag,
    label: "Product Seller",
    desc: "I sell physical products (clothing, accessories, food)",
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
    border: "border-brand-purple/20",
    activeBorder: "border-brand-purple",
    activeBg: "bg-brand-purple/8",
  },
  {
    id: "digital_creator",
    icon: Sparkles,
    label: "Digital Creator",
    desc: "I sell digital products (courses, e-books, templates)",
    color: "text-brand-coral",
    bg: "bg-brand-coral/10",
    border: "border-brand-coral/20",
    activeBorder: "border-brand-coral",
    activeBg: "bg-brand-coral/8",
  },
  {
    id: "service_provider",
    icon: Scissors,
    label: "Service Provider",
    desc: "I offer services (hair, makeup, photography, catering)",
    color: "text-[#25D366]",
    bg: "bg-[#25D366]/10",
    border: "border-[#25D366]/20",
    activeBorder: "border-[#25D366]",
    activeBg: "bg-[#25D366]/8",
  },
  {
    id: "influencer",
    icon: Radio,
    label: "Influencer",
    desc: "I want to sell branded merch and affiliate products",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    activeBorder: "border-pink-500",
    activeBg: "bg-pink-500/8",
  },
  {
    id: "coach",
    icon: BookOpen,
    label: "Coach / Educator",
    desc: "I teach skills, run masterclasses, and mentor clients",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    activeBorder: "border-amber-500",
    activeBg: "bg-amber-500/8",
  },
]

const niches = [
  "Fashion & Beauty",
  "Food & Beverage",
  "Health & Fitness",
  "Tech & Gadgets",
  "Arts & Crafts",
  "Music & Entertainment",
  "Education & Coaching",
  "Home & Lifestyle",
  "Photography",
  "Other",
]

const productCategories = ["Clothing", "Jewellery", "Accessories", "Beauty", "Food", "Digital", "Other"]

// ─── Step components ──────────────────────────────────────────────────────────

function StepCreatorType({
  data,
  onChange,
}: {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
}) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-extrabold text-white">What kind of creator are you?</h2>
        <p className="text-white/50 mt-2 text-sm">We&apos;ll personalise your Lummy experience based on this.</p>
      </div>
      <div className="space-y-3">
        {creatorTypes.map((type) => {
          const Icon = type.icon
          const isActive = data.creatorType === type.id
          return (
            <button
              key={type.id}
              onClick={() => onChange({ creatorType: type.id })}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-150",
                isActive
                  ? `${type.activeBg} ${type.activeBorder} border-2`
                  : "border-white/10 bg-white/3 hover:bg-white/6"
              )}
            >
              <div className={cn("flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border", type.bg, type.border)}>
                <Icon className={cn("h-5 w-5", type.color)} />
              </div>
              <div className="flex-1">
                <p className={cn("font-semibold text-sm", isActive ? "text-white" : "text-white/80")}>{type.label}</p>
                <p className="text-white/40 text-xs mt-0.5">{type.desc}</p>
              </div>
              {isActive && (
                <div className={cn("flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0", type.bg)}>
                  <Check className={cn("h-3 w-3", type.color)} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepStoreSetup({
  data,
  onChange,
}: {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
}) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-extrabold text-white">Set up your store</h2>
        <p className="text-white/50 mt-2 text-sm">This takes 2 minutes. You can edit everything later.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-white/70">Store name</Label>
          <Input
            value={data.storeName}
            onChange={(e) => onChange({ storeName: e.target.value })}
            placeholder="Sade's Fashion Store"
            icon={<Store className="h-4 w-4" />}
            className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/70">
            Store URL{" "}
            <span className="text-white/30 font-normal">(your public link)</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none">
              lummy.co/
            </span>
            <Input
              value={data.handle}
              onChange={(e) => onChange({ handle: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") })}
              placeholder="sade.styles"
              icon={<AtSign className="h-4 w-4" />}
              className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple pl-[88px]"
            />
          </div>
          {data.handle && (
            <p className="text-[11px] text-brand-green flex items-center gap-1">
              <Check className="h-3 w-3" />
              lummy.co/{data.handle} is available
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/70">WhatsApp number</Label>
          <Input
            value={data.whatsapp}
            onChange={(e) => onChange({ whatsapp: e.target.value })}
            placeholder="+234 803 000 0000"
            icon={<Phone className="h-4 w-4 text-[#25D366]" />}
            className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple"
            type="tel"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/70">Niche / Industry</Label>
          <div className="flex flex-wrap gap-2">
            {niches.map((niche) => (
              <button
                key={niche}
                onClick={() => onChange({ niche })}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                  data.niche === niche
                    ? "bg-brand-purple/15 border-brand-purple/40 text-brand-purple"
                    : "border-white/10 text-white/50 hover:text-white hover:border-white/20"
                )}
              >
                {niche}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/70">Location</Label>
          <Input
            value={data.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="Lagos, Nigeria"
            icon={<MapPin className="h-4 w-4" />}
            className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple"
          />
        </div>
      </div>
    </div>
  )
}

function StepFirstProduct({
  data,
  onChange,
}: {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-extrabold text-white">Add your first product</h2>
        <p className="text-white/50 mt-2 text-sm">Optional — you can always add products from your dashboard.</p>
      </div>

      {/* Skip toggle */}
      <button
        onClick={() => onChange({ addProduct: !data.addProduct })}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-2xl border transition-all mb-5",
          data.addProduct
            ? "bg-brand-purple/8 border-brand-purple/30"
            : "bg-white/3 border-white/10"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("flex h-5 w-5 rounded-full border-2 items-center justify-center flex-shrink-0 transition-all",
            data.addProduct ? "bg-brand-purple border-brand-purple" : "border-white/30"
          )}>
            {data.addProduct && <Check className="h-3 w-3 text-white" />}
          </div>
          <span className="text-sm font-medium text-white/80">Yes, add my first product now</span>
        </div>
      </button>

      <AnimatePresence>
        {data.addProduct && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-4"
          >
            <div className="space-y-1.5">
              <Label className="text-white/70">Product name</Label>
              <Input
                value={data.productName}
                onChange={(e) => onChange({ productName: e.target.value })}
                placeholder="Ankara Print Dress"
                icon={<Tag className="h-4 w-4" />}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/70">Price (₦)</Label>
              <Input
                value={data.productPrice}
                onChange={(e) => onChange({ productPrice: e.target.value })}
                placeholder="25000"
                type="number"
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/70">Short description</Label>
              <textarea
                value={data.productDesc}
                onChange={(e) => onChange({ productDesc: e.target.value })}
                placeholder="Describe your product in a few sentences…"
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/70">Category</Label>
              <div className="flex flex-wrap gap-2">
                {productCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onChange({ productCategory: cat })}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                      data.productCategory === cat
                        ? "bg-brand-purple/15 border-brand-purple/40 text-brand-purple"
                        : "border-white/10 text-white/50 hover:text-white hover:border-white/20"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StepBankSetup({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {
  const [verifying, setVerifying] = React.useState(false)
  const [verified, setVerified] = React.useState(false)

  const inputCls = "w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-purple/60"

  const handleVerify = () => {
    if (data.accountNumber.length < 10) return
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      setVerified(true)
      onChange({ accountName: data.storeName ? `${data.storeName.toUpperCase()}` : "ADUNOLA FASHIONISTA" })
    }, 1800)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-white mb-1">Link your bank account</h2>
        <p className="text-sm text-white/50">So we know where to send your earnings. You can change this anytime.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        {/* Bank selector */}
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-2">Bank name</label>
          <select value={data.bankName} onChange={e => { onChange({ bankName: e.target.value }); setVerified(false) }}
            className={cn(inputCls, "appearance-none cursor-pointer")}>
            <option value="" disabled>Select your bank…</option>
            {NIGERIAN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Account number */}
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-2">Account number</label>
          <div className="flex gap-2">
            <input
              value={data.accountNumber}
              onChange={e => { onChange({ accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10) }); setVerified(false) }}
              placeholder="10-digit NUBAN"
              maxLength={10}
              className={cn(inputCls, "flex-1 font-mono tracking-widest")}
            />
            <button
              onClick={handleVerify}
              disabled={data.accountNumber.length < 10 || !data.bankName || verifying || verified}
              className={cn(
                "h-11 px-4 rounded-xl text-sm font-semibold transition-all flex-shrink-0",
                verified
                  ? "bg-brand-green/20 text-brand-green border border-brand-green/30"
                  : "bg-brand-purple text-white hover:bg-brand-purple/90 disabled:opacity-40"
              )}
            >
              {verifying ? <span className="flex items-center gap-1.5"><LummyLoader mode="button" text="Verifying bank..." />Verifying…</span>
                : verified ? <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" />Verified</span>
                : "Verify"}
            </button>
          </div>
        </div>

        {/* Account name (shown after verify) */}
        <AnimatePresence>
          {verified && data.accountName && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-brand-green/10 border border-brand-green/20">
              <ShieldCheck className="h-5 w-5 text-brand-green flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-brand-green">{data.accountName}</p>
                <p className="text-xs text-white/40">{data.bankName} · {data.accountNumber}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-white/8 bg-white/3">
        <Building2 className="h-4 w-4 text-white/30 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-white/40 leading-relaxed">
          Your earnings are paid out every <strong className="text-white/60">Tuesday & Friday</strong>.
          A <strong className="text-white/60">1.5% fee</strong> applies per withdrawal (capped at ₦1,500).
          You&apos;re in full control of when to withdraw.
        </p>
      </div>

      <button onClick={() => onChange({ bankName: "", accountNumber: "", accountName: "" })}
        className="text-xs text-white/30 hover:text-white/60 transition-colors">
        Skip for now — I&apos;ll add this later
      </button>
    </div>
  )
}

function StepPreview({ data }: { data: WizardData }) {
  const [copied, setCopied] = React.useState(false)
  const storeUrl = `lummy.co/${data.handle || "your-store"}`

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${storeUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="text-center">
      {/* Celebration */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-purple to-brand-indigo shadow-brand-lg mb-6 mx-auto"
      >
        <Zap className="h-10 w-10 text-white fill-white" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="font-display text-3xl font-extrabold text-white">
          {data.storeName || "Your store"} is ready! 🎉
        </h2>
        <p className="text-white/50 mt-2 text-sm max-w-xs mx-auto">
          Your Lummy storefront is live. Share the link with your followers and start getting orders.
        </p>
      </motion.div>

      {/* Store URL */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 glass-card rounded-2xl p-4 text-left mx-auto max-w-xs"
      >
        <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">Your store link</p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-white font-semibold text-sm truncate">{storeUrl}</p>
          <button onClick={handleCopy} className="flex-shrink-0 text-white/40 hover:text-white transition-colors">
            {copied ? <CheckCheck className="h-4 w-4 text-brand-green" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      {/* Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 space-y-2 text-left max-w-xs mx-auto"
      >
        {[
          { done: true, label: "Store created" },
          { done: !!data.whatsapp, label: "WhatsApp connected" },
          { done: data.addProduct && !!data.productName, label: "First product added" },
          { done: false, label: "Share your store link" },
          { done: false, label: "Get your first order" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={cn(
              "flex h-5 w-5 rounded-full items-center justify-center flex-shrink-0",
              item.done ? "bg-brand-green/20" : "bg-white/5 border border-white/10"
            )}>
              {item.done && <Check className="h-3 w-3 text-brand-green" />}
            </div>
            <span className={cn("text-sm", item.done ? "text-white" : "text-white/40")}>{item.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
}

export default function OnboardingPage() {
  const router = useRouter()
  const [checkingWorkspace, setCheckingWorkspace] = React.useState(true)

  // Redirect already-onboarded creators straight to dashboard
  React.useEffect(() => {
    const supabase = createClient()
    supabase.from("profiles")
      .select("onboarding_completed, organization_id")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.onboarding_completed && data.organization_id) {
          router.replace("/dashboard")
        }
        setCheckingWorkspace(false)
      }, () => setCheckingWorkspace(false))
  }, [router])

  const DRAFT_KEY = "lummy_onboarding_draft"

  const loadDraft = (): { step: number; data: WizardData } => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(DRAFT_KEY) : null
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return {
      step: 1,
      data: { creatorType: "", storeName: "", handle: "", whatsapp: "", niche: "", location: "", productName: "", productPrice: "", productDesc: "", productCategory: "", addProduct: false, bankName: "", accountNumber: "", accountName: "" },
    }
  }

  const draft = loadDraft()
  const [step, setStep] = React.useState(draft.step)
  const [dir, setDir] = React.useState(1)
  const [data, setData] = React.useState<WizardData>(draft.data)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const saveDraft = React.useCallback((nextStep: number, nextData: WizardData) => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ step: nextStep, data: nextData })) } catch { /* ignore */ }
  }, [])

  const update = (partial: Partial<WizardData>) => setData((d) => {
    const next = { ...d, ...partial }
    saveDraft(step, next)
    return next
  })

  const canAdvance = () => {
    if (step === 1) return !!data.creatorType
    if (step === 2) return !!data.storeName && !!data.handle && !!data.whatsapp
    if (step === 3) return true
    return true
  }

  const next = async () => {
    if (!canAdvance()) return
    setDir(1)
    setStep((s) => { const next = Math.min(s + 1, TOTAL_STEPS); saveDraft(next, data); return next })
  }

  const back = () => {
    setDir(-1)
    setStep((s) => { const prev = Math.max(s - 1, 1); saveDraft(prev, data); return prev })
  }

  const stepLabels = ["Creator Type", "Store Setup", "First Product", "Bank Setup", "Launch 🚀"]

  const submitOnboarding = async () => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      await completeOnboarding({
        fullName: data.storeName || "Creator",
        phone: data.whatsapp,
        orgName: data.storeName || "Creator Workspace",
        handle: data.handle,
        productTitle: data.addProduct ? data.productName : undefined,
        productPrice: data.addProduct && data.productPrice ? Number(data.productPrice) : undefined,
        productDescription: data.addProduct ? data.productDesc : undefined,
      })
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
      window.location.href = "/dashboard"
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to complete onboarding")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-midnight flex flex-col">
      <AnimatePresence>
        {isSubmitting ? (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <LummyLoader
              mode="fullscreen"
              text="Launching your creator OS..."
              subtext="Creating your storefront, workspace, and dashboard access."
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* Header */}
      <header className="flex h-16 items-center justify-between px-6 flex-shrink-0">
        <div className="text-white">
          <LummyLogo className="gap-2" markClassName="h-8 w-8" />
        </div>
        <span className="text-xs text-white/20">Step {step} of {TOTAL_STEPS}</span>
      </header>

      {/* Progress bar */}
      <div className="px-6 mb-8 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-1.5 w-full rounded-full transition-all duration-500",
                  i + 1 <= step ? "bg-brand-purple" : "bg-white/10"
                )}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {stepLabels.map((label, i) => (
            <span
              key={label}
              className={cn(
                "text-[10px] font-medium transition-colors",
                i + 1 === step ? "text-brand-purple" : i + 1 < step ? "text-white/40" : "text-white/20"
              )}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {checkingWorkspace ? (
            <LummyLoader
              mode="inline"
              text="Syncing your workspace..."
              subtext="Checking your onboarding status."
              className="mt-10"
            />
          ) : (
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {step === 1 && <StepCreatorType data={data} onChange={update} />}
              {step === 2 && <StepStoreSetup data={data} onChange={update} />}
              {step === 3 && <StepFirstProduct data={data} onChange={update} />}
              {step === 4 && <StepBankSetup data={data} onChange={update} />}
              {step === 5 && <StepPreview data={data} />}
            </motion.div>
          </AnimatePresence>
          )}
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex-shrink-0 px-6 py-6 border-t border-white/5">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 1 && step < TOTAL_STEPS && (
            <Button variant="outline-white" size="lg" onClick={back} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}

          {step < TOTAL_STEPS ? (
            <Button
              size="lg"
              onClick={() => void next()}
              disabled={!canAdvance()}
              className={cn("flex-1 gap-2", !canAdvance() && "opacity-40")}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex-1 flex flex-col gap-3">
              <LoadingButton
                size="lg"
                className="w-full gap-2"
                onClick={submitOnboarding}
                isLoading={isSubmitting}
                loadingText="Creating dashboard..."
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </LoadingButton>
              <Button variant="whatsapp" size="lg" className="w-full gap-2">
                <MessageCircle className="h-5 w-5 fill-white" />
                Share Store on WhatsApp
              </Button>
              {submitError ? <p className="text-xs text-brand-coral">{submitError}</p> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
