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
  ShoppingBag, Truck, FileText, Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { mockProducts } from "@/data/mock/dashboard"

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
]

const DELIVERY_FEE = 1500
const FREE_DELIVERY_THRESHOLD = 50000

type PaymentMethod = "cash" | "transfer" | "paystack" | "whatsapp"
type OrderStatus = "draft" | "confirmed"

interface OrderItem {
  productId: string
  name: string
  image: string
  price: number
  qty: number
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

function buildConfirmationMsg(items: OrderItem[], customer: CustomerForm, total: number, payment: PaymentMethod, orderId: string): string {
  const itemLines = items.map(i => `• ${i.name} × ${i.qty} — ₦${(i.price * i.qty).toLocaleString()}`).join("\n")
  const payNote = payment === "cash" ? "Cash on delivery" : payment === "transfer" ? "Bank transfer" : payment === "paystack" ? "Payment link sent" : "WhatsApp payment"
  return `🛍️ *Order Confirmed — Sade's Boutique*\n\nHi ${customer.name}! 💜 Thank you for your order.\n\n*Order #${orderId}*\n\n${itemLines}\n\n🚚 Delivery to: ${customer.city}, ${customer.state}\n💰 Total: ₦${total.toLocaleString()} (incl. delivery)\n💳 Payment: ${payNote}\n\nWe'll be in touch shortly with updates. Thank you for choosing us! 💜`
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

export default function NewOrderPage() {
  const router = useRouter()
  const [items, setItems] = React.useState<OrderItem[]>([])
  const [customer, setCustomer] = React.useState<CustomerForm>(emptyCustomer)
  const [payment, setPayment] = React.useState<PaymentMethod>("cash")
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [copiedMsg, setCopiedMsg] = React.useState(false)

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

  const changeQty = (productId: string, delta: number) => {
    setItems(prev => prev.map(i => i.productId === productId
      ? { ...i, qty: Math.max(1, i.qty + delta) }
      : i
    ))
  }

  const removeItem = (productId: string) => setItems(prev => prev.filter(i => i.productId !== productId))

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  const total = subtotal + deliveryFee

  const orderId = `LM${Math.floor(1000 + Math.random() * 9000)}`
  const confirmMsg = buildConfirmationMsg(items, customer, total, payment, orderId)

  const copyMsg = () => {
    navigator.clipboard.writeText(confirmMsg)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2500)
    toast({ title: "Message copied!" })
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
        <div>
          <h1 className="font-display text-xl font-extrabold">New Order</h1>
          <p className="text-xs text-muted-foreground">Record a manual, WhatsApp, or offline sale</p>
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
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setPickerOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Add product
              </Button>
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
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                        <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{item.name}</p>
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
                <div className="px-5 py-2.5">
                  <button onClick={() => setPickerOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand-purple hover:underline">
                    <Plus className="h-3.5 w-3.5" /> Add another product
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField label="Full name" icon={User} value={customer.name} onChange={setCustomerField("name")} placeholder="e.g. Adaeze Okonkwo" required />
              <InputField label="Phone number" icon={Phone} value={customer.phone} onChange={setCustomerField("phone")} placeholder="+234 803 456 7890" type="tel" required />
            </div>
            <InputField label="Email (optional)" icon={FileText} value={customer.email} onChange={setCustomerField("email")} placeholder="customer@email.com" type="email" />
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
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          {/* Order summary */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden lg:sticky lg:top-20">
            <div className="px-5 py-3.5 border-b border-border">
              <h2 className="font-display font-bold text-sm">Order summary</h2>
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
                  <div className="border-t border-border pt-3 space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Subtotal</span>
                      <span>₦{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" /> Delivery
                      </span>
                      {deliveryFee === 0
                        ? <span className="text-brand-green font-semibold">Free</span>
                        : <span>₦{deliveryFee.toLocaleString()}</span>
                      }
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t border-border pt-2">
                      <span>Total</span>
                      <span className="text-brand-purple">₦{total.toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}
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
    </div>
  )
}
