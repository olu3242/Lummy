"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, MessageCircle, ShieldCheck, CreditCard,
  Truck, MapPin, Phone, User, Check, ChevronRight,
  Loader2, Zap, Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { formatMinorMoney } from "@/lib/globalization"
import { storefrontCreator } from "@/data/mock/storefront"

// ─── Product type for checkout (real DB shape) ────────────────────────────────

interface CheckoutProduct {
  id: string
  name: string
  price: number
  currency: string
  image: string
  creatorId: string
  creatorWhatsApp?: string
  storeName: string
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type PaymentMethod = "paystack" | "whatsapp"
type CheckoutStep = "details" | "payment" | "confirmation"

interface CustomerForm {
  name: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  notes: string
}

const REGION_OPTIONS = [
  "Local / same city",
  "Domestic",
  "International",
]

const DELIVERY_FEE = 0
const DELIVERY_DAYS = { local: "1-2", domestic: "3-5", international: "5-10" }

const emptyForm: CustomerForm = {
  name: "", phone: "", email: "", address: "", city: "", state: "Local / same city", notes: "",
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

const inputCls = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30 transition-shadow"

function StepIndicator({ current }: { current: CheckoutStep }) {
  const steps: { id: CheckoutStep; label: string }[] = [
    { id: "details",      label: "Details"  },
    { id: "payment",      label: "Payment"  },
    { id: "confirmation", label: "Done"     },
  ]
  const currentIdx = steps.findIndex(s => s.id === current)

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done = i < currentIdx
        const active = step.id === current
        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all",
                done    ? "bg-brand-purple border-brand-purple text-white" :
                active  ? "bg-background border-brand-purple text-brand-purple" :
                          "bg-background border-border text-muted-foreground"
              )}>
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={cn("text-xs font-medium hidden sm:block", active ? "text-foreground" : "text-muted-foreground")}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("flex-1 h-px mx-2 min-w-[24px] transition-colors", done ? "bg-brand-purple" : "bg-border")} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Order Summary Sidebar ─────────────────────────────────────────────────────

function OrderSummary({ product, qty, form }: {
  product: { name: string; image: string; price: number; currency: string; category?: string }
  qty: number
  form: CustomerForm
}) {
  const subtotal = product.price * qty
  const delivery = DELIVERY_FEE
  const total = subtotal + delivery
  const days = form.state === "International"
    ? DELIVERY_DAYS.international
    : form.state === "Domestic"
      ? DELIVERY_DAYS.domestic
      : DELIVERY_DAYS.local

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Product */}
      <div className="flex gap-3 p-4 border-b border-border">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug">{product.name}</p>
          {product.category && <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>}
          <p className="text-sm font-bold text-brand-purple mt-1">{formatMinorMoney(product.price, product.currency)} × {qty}</p>
        </div>
      </div>

      {/* Pricing breakdown */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Subtotal</span><span>{formatMinorMoney(subtotal, product.currency)}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Truck className="h-3 w-3" />Delivery estimate</span>
          <span>{formatMinorMoney(delivery, product.currency)}</span>
        </div>
        <div className="flex justify-between text-sm font-extrabold border-t border-border pt-2 mt-2">
          <span>Total</span>
          <span className="text-brand-purple">{formatMinorMoney(total, product.currency)}</span>
        </div>
      </div>

      {/* Delivery estimate */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-2.5">
          <Truck className="h-3.5 w-3.5 text-brand-green flex-shrink-0" />
          <span>Estimated delivery: <strong className="text-foreground">{days} business days</strong></span>
        </div>
      </div>

      {/* Trust signals */}
      <div className="px-4 pb-4 space-y-1.5">
        {[
          { icon: ShieldCheck, text: "Secure & encrypted checkout" },
          { icon: Lock,        text: "Payment via Paystack" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Icon className="h-3 w-3 text-brand-green" />{text}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 1: Customer Details ──────────────────────────────────────────────────

function DetailsStep({ form, setForm }: { form: CustomerForm; setForm: React.Dispatch<React.SetStateAction<CustomerForm>> }) {
  const set = <K extends keyof CustomerForm>(k: K, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }} className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-lg">Your details</h2>
        <p className="text-sm text-muted-foreground mt-0.5">We&apos;ll use this to deliver your order.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <FieldLabel required>Full name</FieldLabel>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="Amaka Okonkwo" className={cn(inputCls, "pl-9")} />
          </div>
        </div>

        <div>
          <FieldLabel required>Phone number</FieldLabel>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={form.phone} onChange={e => set("phone", e.target.value)}
              type="tel" placeholder="+1 555 000 0000" className={cn(inputCls, "pl-9")} />
          </div>
        </div>

        <div>
          <FieldLabel>Email <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
            <input value={form.email} onChange={e => set("email", e.target.value)}
            type="email" placeholder="name@email.com" className={inputCls} />
        </div>

        <div className="sm:col-span-2">
          <FieldLabel required>Delivery address</FieldLabel>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={form.address} onChange={e => set("address", e.target.value)}
              placeholder="Street address, apartment, or delivery notes" className={cn(inputCls, "pl-9")} />
          </div>
        </div>

        <div>
          <FieldLabel required>City</FieldLabel>
          <input value={form.city} onChange={e => set("city", e.target.value)}
            placeholder="City" className={inputCls} />
        </div>

        <div>
          <FieldLabel required>Delivery region</FieldLabel>
          <select value={form.state} onChange={e => set("state", e.target.value)}
            className={cn(inputCls, "cursor-pointer")}>
            {REGION_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <FieldLabel>Order notes <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="Any special instructions for the seller…"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30 leading-relaxed" />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Step 2: Payment ───────────────────────────────────────────────────────────

function PaymentStep({
  method, setMethod, product, form, qty,
}: {
  method: PaymentMethod
  setMethod: (m: PaymentMethod) => void
  product: { name: string; price: number; currency: string }
  form: CustomerForm
  qty: number
}) {
  const total = product.price * qty + DELIVERY_FEE
  const totalFormatted = formatMinorMoney(total, product.currency)

  return (
    <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }} className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-lg">Choose payment</h2>
        <p className="text-sm text-muted-foreground mt-0.5">How would you like to pay?</p>
      </div>

      {/* Method cards */}
      <div className="space-y-3">
        {/* Paystack */}
        <button onClick={() => setMethod("paystack")}
          className={cn(
            "w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all",
            method === "paystack" ? "border-brand-purple bg-brand-purple/5" : "border-border hover:border-foreground/20"
          )}>
          <div className={cn(
            "flex h-5 w-5 rounded-full border-2 items-center justify-center flex-shrink-0 mt-0.5 transition-all",
            method === "paystack" ? "border-brand-purple bg-brand-purple" : "border-muted-foreground/30"
          )}>
            {method === "paystack" && <Check className="h-3 w-3 text-white" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-brand-purple" />
              <p className="text-sm font-semibold">Pay with Paystack</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-brand-green/10 text-brand-green font-semibold border border-brand-green/20">Recommended</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Card, bank transfer, USSD, or mobile money. Instant confirmation.</p>
            <div className="flex items-center gap-2 mt-2">
              {["Visa", "Mastercard", "Verve"].map(b => (
                <span key={b} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted border border-border">{b}</span>
              ))}
            </div>
          </div>
        </button>

        {/* WhatsApp */}
        <button onClick={() => setMethod("whatsapp")}
          className={cn(
            "w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all",
            method === "whatsapp" ? "border-[#25D366] bg-[#25D366]/5" : "border-border hover:border-foreground/20"
          )}>
          <div className={cn(
            "flex h-5 w-5 rounded-full border-2 items-center justify-center flex-shrink-0 mt-0.5 transition-all",
            method === "whatsapp" ? "border-[#25D366] bg-[#25D366]" : "border-muted-foreground/30"
          )}>
            {method === "whatsapp" && <Check className="h-3 w-3 text-white" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              <p className="text-sm font-semibold">Order via WhatsApp</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Chat directly with the seller to confirm your order and arrange payment.</p>
          </div>
        </button>
      </div>

      {/* Amount summary */}
      <div className="rounded-2xl bg-muted/50 border border-border p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">You&apos;re paying</p>
          <p className="font-display font-extrabold text-xl text-brand-purple">{totalFormatted}</p>
        </div>
        <ShieldCheck className="h-8 w-8 text-brand-green opacity-60" />
      </div>

      {method === "whatsapp" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Clicking <strong className="text-foreground">Place Order</strong> will open WhatsApp with a pre-filled message to the seller. Confirm your order details and arrange payment directly with them.
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── Step 3: Confirmation ──────────────────────────────────────────────────────

function ConfirmationStep({ orderId, handle }: { orderId: string; handle: string }) {
  return (
    <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }} className="text-center py-6">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-purple to-brand-indigo shadow-brand-lg mx-auto mb-6"
      >
        <Check className="h-10 w-10 text-white" />
      </motion.div>

      <h2 className="font-display font-extrabold text-2xl">Order placed! 🎉</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
        Your order has been received. You&apos;ll get a WhatsApp confirmation from the seller shortly.
      </p>

      <div className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm font-mono">
        Order #{orderId}
      </div>

      <div className="mt-8 space-y-3 max-w-xs mx-auto">
        <Link href={`/track/${orderId}`} className="flex items-center justify-between p-3.5 rounded-2xl border border-border hover:bg-accent transition-colors">
          <div className="flex items-center gap-2.5">
            <Truck className="h-4 w-4 text-brand-purple" />
            <span className="text-sm font-semibold">Track your order</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link href={`/${handle}`} className="flex items-center justify-between p-3.5 rounded-2xl border border-border hover:bg-accent transition-colors">
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-brand-purple" />
            <span className="text-sm font-semibold">Continue shopping</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const params = useParams<{ handle: string; productId: string }>()
  const handle = params?.handle ?? ""
  const productId = params?.productId ?? ""

  // Fetch real product from DB; fall back to mock only for display skeleton
  const [product, setProduct] = React.useState<CheckoutProduct | null>(null)
  const [productLoading, setProductLoading] = React.useState(true)
  const [productError, setProductError] = React.useState(false)
  const [confirmedOrderNumber, setConfirmedOrderNumber] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!productId) return
    fetch(`/api/storefront/${handle}/product/${productId}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(({ data }) => {
        if (data) {
          setProduct({
            id:               data.id,
            name:             data.name,
            price:            Number(data.price ?? 0),
            currency:         data.currency ?? "USD",
            image:            data.image_url ?? "/placeholder-product.jpg",
            creatorId:        data.creator_id,
            creatorWhatsApp:  data.creator_whatsapp,
            storeName:        data.store_name ?? handle,
          })
        } else {
          setProductError(true)
        }
      })
      .catch(() => setProductError(true))
      .finally(() => setProductLoading(false))
  }, [productId, handle])

  const [step, setStep] = React.useState<CheckoutStep>("details")
  const [form, setForm] = React.useState<CustomerForm>(emptyForm)
  const [qty, setQty] = React.useState(1)
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("paystack")
  const [placing, setPlacing] = React.useState(false)

  // Use real product price or fall back to 0 while loading
  const productPrice = product?.price ?? 0
  const total = productPrice * qty + DELIVERY_FEE
  const totalFormatted = product ? formatMinorMoney(total, product.currency) : formatMinorMoney(total)

  const detailsValid = form.name.trim() && form.phone.trim() && form.address.trim() && form.city.trim()

  const handleNext = () => {
    if (step === "details") {
      if (!detailsValid) { toast({ title: "Please fill in all required fields", variant: "default" }); return }
      setStep("payment")
    }
  }

  const handlePlaceOrder = async () => {
    if (!product) return
    setPlacing(true)

    if (paymentMethod === "whatsapp") {
      const msg = `Hi! I'd like to order:\n\n🛍 *${product.name}*\nQty: ${qty}\nTotal: ${totalFormatted}\n\n📦 Deliver to:\n${form.name}\n${form.address}, ${form.city}, ${form.state}\n${form.phone}${form.notes ? `\n\nNotes: ${form.notes}` : ""}`
      const waNumber = (product.creatorWhatsApp ?? storefrontCreator.whatsapp).replace(/\D/g, "")
      const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`
      setPlacing(false)
      setStep("confirmation")
      window.open(url, "_blank")
    } else {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handle,
            productId:  product.id,
            quantity:   qty,
            method:     "paystack",
            customer: {
              email:   form.email || `${form.phone.replace(/\D/g, "")}@lummy.co`,
              name:    form.name,
              phone:   form.phone,
              address: `${form.address}, ${form.city}, ${form.state}`,
            },
          }),
        })
        const data = await res.json() as {
          checkoutUrl?: string
          order?: { id: string }
          error?: string
          message?: string
        }
        if (!res.ok || !data.checkoutUrl) {
          toast({ title: data.message ?? data.error ?? "Payment setup failed", variant: "error" })
          setPlacing(false)
          return
        }
        // Redirect to Paystack hosted checkout
        setConfirmedOrderNumber(data.order?.id?.slice(0, 8).toUpperCase() ?? null)
        window.location.href = data.checkoutUrl
      } catch {
        toast({ title: "Network error — please try again", variant: "error" })
        setPlacing(false)
      }
    }
  }

  // Loading / error states
  if (productLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (productError || !product) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-sm text-center">This product is not available.</p>
        <Link href={`/${handle}`} className="text-brand-purple text-sm font-medium hover:underline">
          ← Back to store
        </Link>
      </div>
    )
  }

  if (step === "confirmation") {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center px-4 border-b border-border bg-background/90 backdrop-blur-sm">
          <Link href={`/${handle}`} className="flex items-center gap-1.5 text-sm font-semibold text-brand-purple">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-purple to-brand-indigo">
              <Zap className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            {product.storeName}
          </Link>
        </header>
        <div className="flex-1 max-w-lg mx-auto px-4 py-8 w-full">
          <ConfirmationStep orderId={confirmedOrderNumber ?? `LM${Date.now().toString().slice(-5)}`} handle={handle} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between px-4 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href={`/${handle}/${productId}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <Link href={`/${handle}`} className="flex items-center gap-1.5 text-sm font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-purple to-brand-indigo">
              <Zap className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            {product.storeName}
          </Link>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Lock className="h-3 w-3" /> Secure checkout
        </div>
      </header>

      {/* Step bar */}
      <div className="border-b border-border px-4 py-3 bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <StepIndicator current={step} />
        </div>
      </div>

      {/* Body — pb-safe ensures content isn't hidden behind keyboard on iOS */}
      <div className="flex-1 max-w-3xl mx-auto px-4 py-6 pb-8 pb-safe w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

          {/* Left: Form */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            {/* Qty selector (details step only) */}
            {step === "details" && (
              <div className="flex items-center justify-between mb-5 pb-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                  </div>
                  <div>
                    <p className="text-xs font-semibold truncate max-w-[160px]">{product.name}</p>
                    <p className="text-xs text-brand-purple font-bold">{formatMinorMoney(product.price, product.currency)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-sm font-bold hover:bg-accent transition-colors">−</button>
                  <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)}
                    className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-sm font-bold hover:bg-accent transition-colors">+</button>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === "details" && <DetailsStep key="details" form={form} setForm={setForm} />}
              {step === "payment" && (
                <PaymentStep key="payment" method={paymentMethod} setMethod={setPaymentMethod}
                  product={product} form={form} qty={qty} />
              )}
            </AnimatePresence>

            {/* CTA */}
            <div className="mt-6 flex gap-3">
              {step === "payment" && (
                <Button variant="outline" onClick={() => setStep("details")} className="flex-shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {step === "details" ? (
                <Button onClick={handleNext} disabled={!detailsValid} className="flex-1 gap-2">
                  Continue to payment <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => { void handlePlaceOrder() }}
                  disabled={placing}
                  variant={paymentMethod === "whatsapp" ? "whatsapp" : "default"}
                  className="flex-1 gap-2"
                >
                  {placing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
                  ) : paymentMethod === "whatsapp" ? (
                    <><MessageCircle className="h-4 w-4 fill-white" />Order via WhatsApp</>
                  ) : (
                    <><Lock className="h-4 w-4" />Pay {totalFormatted}</>
                  )}
                </Button>
              )}
            </div>

            <p className="text-center text-[10px] text-muted-foreground mt-3 flex items-center justify-center gap-1">
              <ShieldCheck className="h-3 w-3 text-brand-green" />
              Your details are secure and encrypted
            </p>
          </div>

          {/* Right: Order summary (sticky on desktop) */}
          <div className="order-first lg:order-last lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Order summary</p>
            <OrderSummary product={product} qty={qty} form={form} />
          </div>
        </div>
      </div>
    </div>
  )
}
