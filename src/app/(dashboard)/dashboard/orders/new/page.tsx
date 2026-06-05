"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Search, Plus, Minus, X, MessageCircle,
  User, Phone, MapPin, CreditCard, Banknote, Wallet,
  ChevronRight, CheckCircle2, Package, Copy, CheckCheck,
  ShoppingBag, Truck, FileText, Send, Tag, Clock,
  Instagram, Radio, Users, Store, Sparkles,
  CalendarDays, ChevronDown, ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { mockProducts } from "@/data/mock/dashboard"

const RECENT_CUSTOMERS = [
  { id: "c1", name: "Adaeze Okonkwo",  phone: "+234 803 456 7890" },
  { id: "c2", name: "Chidi Nwosu",     phone: "+234 812 345 6789" },
  { id: "c3", name: "Fatima Aliyu",    phone: "+234 701 234 5678" },
  { id: "c4", name: "Tunde Bakare",    phone: "+234 906 789 0123" },
  { id: "c5", name: "Ngozi Eze",       phone: "+234 815 678 9012" },
  { id: "c6", name: "Emeka Obi",       phone: "+234 803 567 8901" },
]

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
]

const DELIVERY_FEE = 1500
const FREE_DELIVERY_THRESHOLD = 50000
const TAX_RATE = 0 // optional VAT, 0 by default

type PaymentMethod = "cash" | "transfer" | "paystack" | "whatsapp"
type OrderSource   = "whatsapp" | "instagram" | "walk-in" | "referral" | "other"
type OrderStatus   = "draft" | "confirmed"

interface OrderItem {
  productId: string
  name: string
  image: string
  price: number
  qty: number
  isCustom?: boolean
}

interface CustomerForm {
  name: string; phone: string; email: string
  address: string; city: string; state: string; notes: string
}

const emptyCustomer: CustomerForm = { name: "", phone: "", email: "", address: "", city: "", state: "", notes: "" }

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  { id: "cash",     label: "Cash on Delivery",  desc: "Collect payment on delivery",           icon: Banknote,      color: "text-brand-green"  },
  { id: "transfer", label: "Bank Transfer",      desc: "Customer pays to your account",         icon: Wallet,        color: "text-brand-purple" },
  { id: "paystack", label: "Paystack Link",      desc: "Send a payment link via SMS/WhatsApp",  icon: CreditCard,    color: "text-brand-indigo" },
  { id: "whatsapp", label: "WhatsApp Order",     desc: "Confirm and collect via WhatsApp chat", icon: MessageCircle, color: "text-[#25D366]"    },
]

const ORDER_SOURCES: { id: OrderSource; label: string; icon: React.ElementType }[] = [
  { id: "whatsapp",  label: "WhatsApp",  icon: MessageCircle },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "walk-in",   label: "Walk-in",   icon: Store },
  { id: "referral",  label: "Referral",  icon: Users },
  { id: "other",     label: "Other",     icon: Radio },
]

const PROMO_CODES: Record<string, number> = {
  "SADE10":  10,
  "NEWCUST": 15,
  "FLASH20": 20,
  "VIP25":   25,
}

function buildConfirmationMsg(items: OrderItem[], customer: CustomerForm, total: number, payment: PaymentMethod, orderId: string): string {
  const itemLines = items.map(i => `• ${i.name} × ${i.qty} — ₦${(i.price * i.qty).toLocaleString()}`).join("\n")
  const payNote = payment === "cash" ? "Cash on delivery" : payment === "transfer" ? "Bank transfer" : payment === "paystack" ? "Payment link sent" : "WhatsApp payment"
  return `🛍️ *Order Confirmed*\n\nHi ${customer.name}! 💜 Thank you for your order.\n\n*Order #${orderId}*\n\n${itemLines}\n\n🚚 Delivery to: ${customer.city}, ${customer.state}\n💰 Total: ₦${total.toLocaleString()} (incl. delivery)\n💳 Payment: ${payNote}\n\nWe'll be in touch shortly with updates. Thank you for choosing us! 💜`
}

function ProductPicker({ selected, onAdd, onClose }: {
  selected: string[]
  onAdd: (productId: string) => void
  onClose: () => void
}) {
  const [q, setQ] = React.useState("")
  const results = mockProducts.filter(p =>
    p.status === "active" &&
    (p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()))
  )

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}>
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="w-full max-w-md bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-display font-bold text-sm">Add product</h3>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="px-4 pt-3 pb-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" autoFocus
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-border">
            {results.map(p => {
              const added = selected.includes(p.id)
              return (
                <button key={p.id} onClick={() => { onAdd(p.id); onClose() }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left">
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                    <Image src={p.image} alt={p.name} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.category} · {p.stock !== null ? `${p.stock} in stock` : "Unlimited"}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-bold text-brand-purple">₦{p.price.toLocaleString()}</p>
                    {added && <Badge variant="brand" size="sm">Added</Badge>}
                  </div>
                </button>
              )
            })}
            {results.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">No products found</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/** Custom item (not in catalog) modal */
function CustomItemModal({ onAdd, onClose }: {
  onAdd: (item: OrderItem) => void
  onClose: () => void
}) {
  const [name, setName] = React.useState("")
  const [price, setPrice] = React.useState("")

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-xs bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-display font-bold text-sm">Custom Item</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1.5">Item name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Custom alteration fee"
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5">Price (₦) *</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="5000" min="0"
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 text-xs" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 text-xs" onClick={() => {
              if (!name.trim() || !Number(price)) { toast({ title: "Fill in all fields" }); return }
              onAdd({
                productId: `custom-${Date.now()}`,
                name: name.trim(),
                image: "/placeholder.png",
                price: Number(price),
                qty: 1,
                isCustom: true,
              })
              onClose()
              toast({ title: "Custom item added!", variant: "success" })
            }}>Add Item</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function InputField({ label, icon: Icon, value, onChange, placeholder, type = "text", required }: {
  label: string; icon: React.ElementType; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}{required && " *"}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
      </div>
    </div>
  )
}

/** Customer autocomplete dropdown */
function CustomerAutocomplete({ value, onSelect }: {
  value: string
  onSelect: (c: { name: string; phone: string }) => void
}) {
  const [open, setOpen] = React.useState(false)
  const matches = RECENT_CUSTOMERS
    .filter(c => c.name.toLowerCase().includes(value.toLowerCase()) && value.length > 1)
    .slice(0, 5)

  if (!open || matches.length === 0) return null

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="absolute top-full left-0 right-0 z-20 mt-1 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
      {matches.map((c: typeof RECENT_CUSTOMERS[0]) => (
        <button key={c.id} onClick={() => { onSelect({ name: c.name, phone: c.phone }); setOpen(false) }}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left">
          <div className="w-7 h-7 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-brand-purple">{c.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{c.name}</p>
            <p className="text-[10px] text-muted-foreground">{c.phone}</p>
          </div>
          <Badge variant="brand" size="sm">Returning</Badge>
        </button>
      ))}
    </motion.div>
  )
}

export default function NewOrderPage() {
  const router = useRouter()
  const [items, setItems]             = React.useState<OrderItem[]>([])
  const [customer, setCustomer]       = React.useState<CustomerForm>(emptyCustomer)
  const [payment, setPayment]         = React.useState<PaymentMethod>("cash")
  const [source, setSource]           = React.useState<OrderSource>("whatsapp")
  const [pickerOpen, setPickerOpen]   = React.useState(false)
  const [customOpen, setCustomOpen]   = React.useState(false)
  const [saved, setSaved]             = React.useState(false)
  const [copiedMsg, setCopiedMsg]     = React.useState(false)
  const [promoCode, setPromoCode]     = React.useState("")
  const [promoApplied, setPromoApplied] = React.useState<{ code: string; pct: number } | null>(null)
  const [promoError, setPromoError]   = React.useState("")
  const [priority, setPriority]       = React.useState(false)
  const [deliveryDate, setDeliveryDate] = React.useState("")
  const [extraOpen, setExtraOpen]     = React.useState(false)
  const [nameSearchOpen, setNameSearchOpen] = React.useState(false)

  const setCustomerField = (k: keyof CustomerForm) => (v: string) => setCustomer(c => ({ ...c, [k]: v }))

  const addProduct = (productId: string) => {
    const p = mockProducts.find(x => x.id === productId)
    if (!p) return
    setItems(prev => {
      const exists = prev.find(i => i.productId === productId)
      if (exists) return prev.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { productId: p.id, name: p.name, image: p.image, price: p.price, qty: 1 }]
    })
  }

  const addCustomItem = (item: OrderItem) => {
    setItems(prev => [...prev, item])
  }

  const changeQty = (productId: string, delta: number) => {
    setItems(prev => prev.map(i => i.productId === productId
      ? { ...i, qty: Math.max(1, i.qty + delta) }
      : i
    ))
  }

  const removeItem = (productId: string) => setItems(prev => prev.filter(i => i.productId !== productId))

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  const discountAmt  = promoApplied ? Math.round(subtotal * promoApplied.pct / 100) : 0
  const taxAmt       = Math.round((subtotal - discountAmt) * TAX_RATE / 100)
  const total = subtotal - discountAmt + taxAmt + deliveryFee

  const freeDeliveryProgress = Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100)

  const [orderId, setOrderId] = React.useState("LM0000")

  React.useEffect(() => {
    setOrderId(`LM${Math.floor(1000 + Math.random() * 9000)}`)
  }, [])
  const confirmMsg = buildConfirmationMsg(items, customer, total, payment, orderId)

  const copyMsg = () => {
    navigator.clipboard.writeText(confirmMsg)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2500)
    toast({ title: "Message copied!" })
  }

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase()
    const pct = PROMO_CODES[code]
    if (!pct) { setPromoError("Invalid or expired code"); return }
    setPromoApplied({ code, pct })
    setPromoError("")
    toast({ title: `Promo applied! ${pct}% off`, variant: "success" })
  }

  const removePromo = () => {
    setPromoApplied(null)
    setPromoCode("")
    setPromoError("")
  }

  const handleSave = (status: OrderStatus) => {
    if (items.length === 0) { toast({ title: "Add at least one product" }); return }
    if (!customer.name.trim()) { toast({ title: "Enter customer name" }); return }
    setSaved(true)
    setTimeout(() => {
      toast({ title: status === "confirmed" ? "Order confirmed!" : "Draft saved", description: `Order ${orderId} created.` })
      router.push("/dashboard/orders")
    }, 800)
  }

  return (
    <div className="p-4 sm:p-6 pb-28 lg:pb-8 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orders" className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-xl font-extrabold">New Order</h1>
          <p className="text-xs text-muted-foreground">Record a manual, WhatsApp, or offline sale</p>
        </div>
        {/* Priority toggle */}
        <button onClick={() => setPriority(p => !p)}
          className={cn(
            "flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition-all",
            priority ? "border-brand-coral/30 bg-brand-coral/10 text-brand-coral" : "border-border text-muted-foreground hover:bg-muted"
          )}>
          <Sparkles className="h-3.5 w-3.5" />
          {priority ? "Priority" : "Normal"}
        </button>
      </div>

      {/* Order source */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Order source</p>
        <div className="flex flex-wrap gap-2">
          {ORDER_SOURCES.map(s => (
            <button key={s.id} onClick={() => setSource(s.id)}
              className={cn("flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition-all",
                source === s.id ? "border-brand-purple/30 bg-brand-purple/10 text-brand-purple" : "border-border hover:bg-muted text-muted-foreground")}>
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 space-y-5 lg:space-y-0">
        {/* Left: Products + Customer + Payment */}
        <div className="space-y-5">
          {/* Products */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h2 className="font-display font-bold text-sm flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-brand-purple" /> Products
              </h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setCustomOpen(true)}>
                  <Tag className="h-3.5 w-3.5" /> Custom item
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setPickerOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add product
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <button onClick={() => setPickerOpen(true)}
                className="w-full py-10 flex flex-col items-center gap-3 text-center hover:bg-muted/30 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-brand-purple" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">No products added</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Click to pick from your catalog</p>
                </div>
              </button>
            ) : (
              <div className="divide-y divide-border">
                <AnimatePresence>
                  {items.map(item => (
                    <motion.div key={item.productId}
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 px-5 py-3.5">
                      {item.isCustom ? (
                        <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                          <Tag className="h-4 w-4 text-brand-purple" />
                        </div>
                      ) : (
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                          <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold truncate">{item.name}</p>
                          {item.isCustom && <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple">custom</span>}
                        </div>
                        <p className="text-xs text-brand-purple font-bold">₦{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => changeQty(item.productId, -1)}
                          className="w-7 h-7 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                        <button onClick={() => changeQty(item.productId, 1)}
                          className="w-7 h-7 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs font-bold w-20 text-right">₦{(item.price * item.qty).toLocaleString()}</p>
                      <button onClick={() => removeItem(item.productId)} className="p-1 rounded-lg hover:bg-brand-coral/10 hover:text-brand-coral text-muted-foreground transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div className="px-5 py-2.5 flex items-center gap-3">
                  <button onClick={() => setPickerOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand-purple hover:underline">
                    <Plus className="h-3.5 w-3.5" /> Add another product
                  </button>
                  <span className="text-border">·</span>
                  <button onClick={() => setCustomOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                    <Tag className="h-3.5 w-3.5" /> Custom item
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Customer details */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-display font-bold text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-brand-purple" /> Customer details
            </h2>
            {/* Name field with autocomplete */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Full name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input value={customer.name}
                  onChange={e => { setCustomerField("name")(e.target.value); setNameSearchOpen(true) }}
                  onBlur={() => setTimeout(() => setNameSearchOpen(false), 150)}
                  placeholder="e.g. Adaeze Okonkwo"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                <AnimatePresence>
                  {nameSearchOpen && customer.name.length > 1 && (
                    <CustomerAutocomplete
                      value={customer.name}
                      onSelect={c => {
                        setCustomer(prev => ({ ...prev, name: c.name, phone: c.phone }))
                        setNameSearchOpen(false)
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField label="Phone number" icon={Phone} value={customer.phone} onChange={setCustomerField("phone")} placeholder="+234 803 456 7890" type="tel" required />
              <InputField label="Email (optional)" icon={FileText} value={customer.email} onChange={setCustomerField("email")} placeholder="customer@email.com" type="email" />
            </div>
            <InputField label="Delivery address" icon={MapPin} value={customer.address} onChange={setCustomerField("address")} placeholder="Street address" />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="City" icon={MapPin} value={customer.city} onChange={setCustomerField("city")} placeholder="e.g. Victoria Island" />
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">State</label>
                <select value={customer.state} onChange={e => setCustomerField("state")(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30">
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Order note (optional)</label>
              <textarea value={customer.notes} onChange={e => setCustomerField("notes")(e.target.value)}
                rows={2} placeholder="e.g. Call before delivery, specific colour preference…"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none" />
            </div>
          </div>

          {/* Payment method */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h2 className="font-display font-bold text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-brand-purple" /> Payment method
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setPayment(opt.id)}
                  className={cn(
                    "flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all",
                    payment === opt.id ? "border-brand-purple/30 bg-brand-purple/5" : "border-border hover:bg-muted/40"
                  )}>
                  <opt.icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", payment === opt.id ? opt.color : "text-muted-foreground")} />
                  <div>
                    <p className={cn("text-xs font-semibold", payment === opt.id ? "text-foreground" : "text-muted-foreground")}>{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Extra options (collapsible) */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button onClick={() => setExtraOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors text-sm font-bold">
              <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-purple" /> Scheduling & Options</span>
              {extraOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            <AnimatePresence>
              {extraOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="border-t border-border p-5 space-y-4">
                    {/* Scheduled delivery date */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5 block">
                        <CalendarDays className="h-3.5 w-3.5" /> Scheduled delivery date
                      </label>
                      <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                    </div>
                    {/* Priority */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold">Priority order</p>
                        <p className="text-[10px] text-muted-foreground">Mark for express processing</p>
                      </div>
                      <button onClick={() => setPriority(p => !p)} className="p-0.5">
                        {priority
                          ? <div className="w-10 h-5 rounded-full bg-brand-coral flex items-center justify-end pr-0.5"><div className="w-4 h-4 rounded-full bg-white" /></div>
                          : <div className="w-10 h-5 rounded-full bg-muted flex items-center justify-start pl-0.5"><div className="w-4 h-4 rounded-full bg-white border border-border" /></div>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card overflow-hidden lg:sticky lg:top-20">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-bold text-sm">Order summary</h2>
              {priority && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3" /> Priority
                </span>
              )}
            </div>
            <div className="p-5 space-y-3">
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Add products to see summary</p>
              ) : (
                <>
                  {items.map(i => (
                    <div key={i.productId} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate flex-1">{i.name} × {i.qty}</span>
                      <span className="font-semibold ml-2">₦{(i.price * i.qty).toLocaleString()}</span>
                    </div>
                  ))}

                  {/* Free delivery progress */}
                  {deliveryFee > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Free delivery progress</span>
                        <span className="font-semibold">₦{(FREE_DELIVERY_THRESHOLD - subtotal).toLocaleString()} away</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div className="h-full bg-brand-green rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${freeDeliveryProgress}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }} />
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border pt-3 space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Subtotal</span>
                      <span>₦{subtotal.toLocaleString()}</span>
                    </div>
                    {promoApplied && (
                      <div className="flex justify-between text-xs text-brand-green">
                        <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {promoApplied.code} ({promoApplied.pct}% off)</span>
                        <span>−₦{discountAmt.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" /> Delivery
                      </span>
                      {deliveryFee === 0
                        ? <span className="text-brand-green font-semibold">Free 🎉</span>
                        : <span>₦{deliveryFee.toLocaleString()}</span>
                      }
                    </div>
                    {deliveryDate && (
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Delivery date</span>
                        <span className="font-semibold text-foreground">{new Date(deliveryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold border-t border-border pt-2">
                      <span>Total</span>
                      <span className="text-brand-purple">₦{total.toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Promo code */}
              <div className="pt-1 space-y-1.5">
                {promoApplied ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-brand-green/5 border border-brand-green/20">
                    <span className="text-xs font-semibold text-brand-green flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {promoApplied.code} applied
                    </span>
                    <button onClick={removePromo} className="text-[10px] text-muted-foreground hover:text-brand-coral">Remove</button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="Promo code"
                          onKeyDown={e => { if (e.key === "Enter") applyPromo() }}
                          className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-background text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                      </div>
                      <button onClick={applyPromo}
                        className="px-3 h-9 rounded-xl border border-brand-purple/30 bg-brand-purple/10 text-brand-purple text-xs font-semibold hover:bg-brand-purple/20 transition-colors">
                        Apply
                      </button>
                    </div>
                    {promoError && <p className="text-[10px] text-brand-coral">{promoError}</p>}
                  </>
                )}
              </div>
            </div>

            {/* WhatsApp confirmation message */}
            {items.length > 0 && customer.name && (
              <div className="px-5 pb-5 space-y-2">
                <div className="rounded-xl border border-[#25D366]/20 bg-[#25D366]/5 p-3 space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp confirmation</p>
                  <p className="text-xs whitespace-pre-line leading-relaxed line-clamp-5">{confirmMsg}</p>
                  <div className="flex gap-2 pt-0.5">
                    <button onClick={copyMsg} className="flex items-center gap-1 text-[11px] font-semibold text-brand-purple hover:underline">
                      {copiedMsg ? <CheckCheck className="h-3 w-3 text-brand-green" /> : <Copy className="h-3 w-3" />}
                      {copiedMsg ? "Copied!" : "Copy"}
                    </button>
                    <a href={`https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(confirmMsg)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#25D366] hover:underline">
                      <Send className="h-3 w-3" /> Send now
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Order source badge */}
            {source && (
              <div className="px-5 pb-3">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {ORDER_SOURCES.find(s => s.id === source) && (() => {
                    const s = ORDER_SOURCES.find(s => s.id === source)!
                    return (
                      <>
                        <s.icon className="h-3 w-3" />
                        <span>Source: <span className="font-semibold text-foreground">{s.label}</span></span>
                      </>
                    )
                  })()}
                  {priority && <span className="ml-auto flex items-center gap-0.5 text-brand-coral font-semibold"><Sparkles className="h-3 w-3" /> Priority</span>}
                </div>
              </div>
            )}

            <div className="px-5 pb-5 space-y-2.5">
              <Button className="w-full gap-2" disabled={saved || items.length === 0} onClick={() => handleSave("confirmed")}>
                <CheckCircle2 className="h-4 w-4" /> Confirm Order
              </Button>
              <Button variant="outline" className="w-full gap-2 text-xs" disabled={saved || items.length === 0} onClick={() => handleSave("draft")}>
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </div>

      {pickerOpen && (
        <ProductPicker
          selected={items.map(i => i.productId)}
          onAdd={addProduct}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <AnimatePresence>
        {customOpen && (
          <CustomItemModal
            key="custom"
            onAdd={addCustomItem}
            onClose={() => setCustomOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
