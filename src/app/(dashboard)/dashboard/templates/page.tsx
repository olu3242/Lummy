"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageCircle, Copy, CheckCheck, Plus, Search, Heart,
  Package, Truck, Star, Megaphone, Users, HelpCircle, X,
  Sparkles, ExternalLink, Loader2, Zap, Edit3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

type Category = "orders" | "shipping" | "promotions" | "support" | "followup" | "reviews" | "custom"

interface Template {
  id: string
  name: string
  category: Category
  message: string
  uses: number
  isFavorite?: boolean
  isCustom?: boolean
}

const CATEGORY_CONFIG: Record<Category, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  orders:     { label: "Order Updates",  icon: Package,       color: "text-brand-purple", bg: "bg-brand-purple/10", border: "border-brand-purple/20" },
  shipping:   { label: "Shipping",       icon: Truck,         color: "text-brand-indigo", bg: "bg-brand-indigo/10", border: "border-brand-indigo/20" },
  promotions: { label: "Promotions",     icon: Megaphone,     color: "text-brand-coral",  bg: "bg-brand-coral/10",  border: "border-brand-coral/20"  },
  support:    { label: "Customer Care",  icon: HelpCircle,    color: "text-amber-500",    bg: "bg-amber-500/10",    border: "border-amber-500/20"    },
  followup:   { label: "Follow-ups",     icon: Users,         color: "text-brand-green",  bg: "bg-brand-green/10",  border: "border-brand-green/20"  },
  reviews:    { label: "Reviews",        icon: Star,          color: "text-pink-500",     bg: "bg-pink-500/10",     border: "border-pink-500/20"     },
  custom:     { label: "Custom",         icon: Edit3,         color: "text-muted-foreground", bg: "bg-muted",       border: "border-border"          },
}

const INITIAL_TEMPLATES: Template[] = [
  // Orders
  { id: "t1", category: "orders", name: "Order Confirmed", uses: 247,
    message: "Hi {name}! 🎉 Thank you so much for your order!\n\n*Order details:*\n📦 {product}\n💰 ₦{amount}\n📋 Order ID: {orderId}\n\nWe're preparing your order with love and care. You'll hear from us once it ships! 💜\n\n— Sade's Boutique" },
  { id: "t2", category: "orders", name: "Order Processing", uses: 183,
    message: "Hi {name}! 🛍️ Great news — your order is being prepared!\n\n*{product}* is currently being packaged and will be ready for dispatch within 24 hours.\n\nWe'll send you a tracking update once it's with the courier. Thank you for your patience! 💜" },
  { id: "t3", category: "orders", name: "Out of Stock Apology", uses: 89,
    message: "Hi {name}, I'm so sorry to let you know that *{product}* is currently out of stock. 😔\n\nI've added you to our restock waitlist and will notify you the moment it's back — usually within 7-10 days.\n\nWould you like to see similar items in the meantime? 💜" },
  // Shipping
  { id: "t4", category: "shipping", name: "Order Shipped", uses: 312,
    message: "Hi {name}! 🚚 Your order is on its way!\n\n*Shipping details:*\n📦 {product}\n🚚 Via: GIG Logistics\n📍 Tracking: {tracking}\n⏱️ Estimated arrival: {eta}\n\nYou can track your package using the number above. DM me if you have any questions! 💜" },
  { id: "t5", category: "shipping", name: "Delivery Delay Notice", uses: 44,
    message: "Hi {name}, I wanted to give you a quick update on your order. 🙏\n\nDue to high demand, your *{product}* is experiencing a slight delay. New estimated delivery: *{eta}*.\n\nWe sincerely apologize for the inconvenience. As a token of appreciation, here's a 10% discount on your next order: *SORRY10* 💜" },
  { id: "t6", category: "shipping", name: "Order Delivered — Check-in", uses: 198,
    message: "Hi {name}! 🎉 Your order should have arrived by now.\n\nWe hope you're absolutely loving your *{product}*! 💜\n\nIf there's any issue with your order, please reach out immediately and we'll make it right. Your satisfaction is everything to us! 🛍️" },
  // Promotions
  { id: "t7", category: "promotions", name: "Flash Sale Alert", uses: 521,
    message: "🔥 *FLASH SALE — Today Only!*\n\nHi {name}! We have an exclusive offer just for you:\n\n✨ Get *{discount}* off everything in store\n⏰ Offer ends midnight tonight\n🛍️ Shop now: lummy.co/sade.styles\n\nUse code: *{code}*\n\nDon't miss out — limited stock! 💜" },
  { id: "t8", category: "promotions", name: "New Collection Drop", uses: 389,
    message: "✨ *NEW DROP ALERT!*\n\nHi {name}! Our brand new *{collection}* just landed and it's everything! 🔥\n\nLimited pieces available — first come, first served!\n\n🛍️ Shop: lummy.co/sade.styles\n📲 DM me to reserve yours\n\nTag someone who would love this! 💜" },
  { id: "t9", category: "promotions", name: "VIP Early Access", uses: 156,
    message: "💜 *VIP EARLY ACCESS*\n\nHi {name}, as one of our most valued customers, you get first access to our new collection before it goes public!\n\nUse link: lummy.co/sade.styles/vip\nPassword: *{password}*\n\nValid for 24 hours only. Thank you for being amazing! 🌟" },
  { id: "t10", category: "promotions", name: "Referral Reward", uses: 93,
    message: "🎁 *You've earned a reward!*\n\nHi {name}! Thank you for referring *{friend}* to Sade's Boutique.\n\nAs our gift to you:\n💰 ₦{amount} store credit\n🎟️ Bonus code: *{code}*\n\nYour credit will be applied on your next order automatically. You're the best! 💜" },
  // Support
  { id: "t11", category: "support", name: "Size Guide Response", uses: 134,
    message: "Hi {name}! 😊 Happy to help with sizing!\n\nHere's our size guide for *{product}*:\n\n📏 *S* — Bust 32-34\", Waist 26-28\"\n📏 *M* — Bust 34-36\", Waist 28-30\"\n📏 *L* — Bust 36-38\", Waist 30-32\"\n📏 *XL* — Bust 38-40\", Waist 32-34\"\n\nWe recommend sizing up if you prefer a relaxed fit. What size are you usually? 💜" },
  { id: "t12", category: "support", name: "Return Policy", uses: 67,
    message: "Hi {name}! Here's our return policy:\n\n✅ *7-day returns* on items in original condition\n✅ *Exchange* available for size/colour issues\n❌ *Custom orders* are non-refundable\n\nTo initiate a return, simply reply with your order ID and reason. We'll sort it out right away! 💜\n\n— Sade's Boutique" },
  { id: "t13", category: "support", name: "Custom Order Inquiry", uses: 211,
    message: "Hi {name}! 💜 Thank you for your interest in a custom order!\n\nTo get started, I'll need:\n1️⃣ Your measurements (bust, waist, hips, length)\n2️⃣ Fabric preference (Ankara, lace, cotton, etc.)\n3️⃣ Colour choice\n4️⃣ Event date (so we can plan production time)\n\nCustom orders take *10-14 business days*. Let's create something beautiful! ✨" },
  // Follow-ups
  { id: "t14", category: "followup", name: "Win Back — At Risk", uses: 78,
    message: "Hi {name}, we miss you! 🥺\n\nIt's been a while since your last order and we'd love to have you back.\n\n🎁 Here's a special welcome-back offer just for you:\n*{discount}% off* your next purchase\n\nCode: *COMEBACK{code}*\nValid for 7 days.\n\nWe have amazing new pieces you'll love! 💜 lummy.co/sade.styles" },
  { id: "t15", category: "followup", name: "Birthday Message", uses: 143,
    message: "🎂 *Happy Birthday, {name}!*\n\nWishing you a wonderful day filled with joy and beautiful things! 💜\n\nTo celebrate, here's a *birthday gift from us*:\n🎁 {discount}% off your next order\n\nCode: *BDAY{name}*\nValid until end of your birthday month.\n\nWith love, Sade's Boutique 🌸" },
  { id: "t16", category: "followup", name: "Post-Purchase Upsell", uses: 201,
    message: "Hi {name}! 💜 Hope you're loving your *{product}*!\n\nCustomers who bought this also loved:\n✨ {upsell1}\n✨ {upsell2}\n\nWant to complete the look? I can reserve one for you — just say the word! 🛍️" },
  // Reviews
  { id: "t17", category: "reviews", name: "Review Request", uses: 289,
    message: "Hi {name}! 🌟 Hope you're enjoying your *{product}*!\n\nWould you mind taking 30 seconds to leave us a review? Your feedback helps us serve you and others better.\n\n⭐ Leave a review: lummy.co/sade.styles/review\n\nThank you so much! 💜 — Sade" },
  { id: "t18", category: "reviews", name: "Positive Review Reply", uses: 167,
    message: "Thank you so much, {name}! 🥹💜\n\nYour kind words truly mean everything to us. We put our heart into every piece and it's so rewarding to hear that you love your *{product}*!\n\nWe can't wait to serve you again. You're the best! 🌟" },
]

const AI_SUGGESTIONS: Record<string, string> = {
  orders:     "Hi {name}! 🎉 Your order for *{product}* has been confirmed. We're so excited to prepare this for you! Order #{orderId}. We'll keep you updated every step of the way. Thank you for choosing us! 💜",
  shipping:   "Hi {name}! 🚚 Your package is officially on its way! *{product}* has been picked up by our courier and is heading to you. Track with: {tracking}. Expected by {eta}! 💜",
  promotions: "🔥 Hey {name}! Exciting news — we're running a special offer just for you. {offer}. Shop now at lummy.co/sade.styles and use code *{code}* at checkout. Offer ends soon! 💜",
  support:    "Hi {name}! 😊 Thank you for reaching out — I'm here to help! {answer}. Please don't hesitate to ask if you need anything else. Your satisfaction is our top priority! 💜",
  followup:   "Hi {name}! 💜 It's been a while since we connected and we'd love to check in. We have exciting new arrivals and a special offer for you: {offer}. Come say hi at lummy.co/sade.styles! 🛍️",
  reviews:    "Hi {name}! 🌟 We hope you're absolutely loving your *{product}*! Your opinion matters so much to us. Would you mind sharing a quick review? It only takes a moment and helps us grow! Thank you 💜",
  custom:     "Hi {name}! 💜 {message}. Thank you for being an amazing customer — we truly appreciate your support! — Sade's Boutique",
}

function TemplateCard({ template, onCopy, onToggleFavorite, onEdit }: {
  template: Template
  onCopy: (t: Template) => void
  onToggleFavorite: (id: string) => void
  onEdit: (t: Template) => void
}) {
  const [copied, setCopied] = React.useState(false)
  const cfg = CATEGORY_CONFIG[template.category]
  const Icon = cfg.icon

  const copy = () => {
    navigator.clipboard.writeText(template.message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopy(template)
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(template.message)}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0", cfg.bg, cfg.border, "border")}>
            <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
          </div>
          <div>
            <p className="text-xs font-bold">{template.name}</p>
            <p className="text-[10px] text-muted-foreground">{template.uses.toLocaleString()} uses</p>
          </div>
        </div>
        <button onClick={() => onToggleFavorite(template.id)}
          className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
          <Heart className={cn("h-3.5 w-3.5 transition-colors", template.isFavorite ? "text-brand-coral fill-brand-coral" : "text-muted-foreground")} />
        </button>
      </div>

      {/* Message preview */}
      <div className="relative">
        <div className="rounded-xl bg-[#25D366]/5 border border-[#25D366]/15 p-3 text-xs leading-relaxed text-foreground whitespace-pre-line line-clamp-4">
          {template.message}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent rounded-b-xl pointer-events-none" />
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 mt-auto">
        <button onClick={copy}
          className={cn("flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl border text-[11px] font-semibold transition-all",
            copied ? "bg-brand-green/10 border-brand-green/20 text-brand-green" : "border-border hover:bg-muted text-muted-foreground hover:text-foreground")}>
          {copied ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
        <a href={wa} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-[11px] font-semibold hover:bg-[#25D366]/15 transition-colors">
          <MessageCircle className="h-3 w-3" /> WhatsApp
        </a>
        {template.isCustom && (
          <button onClick={() => onEdit(template)}
            className="h-8 w-8 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors">
            <Edit3 className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

function CreateModal({ open, editing, onClose, onSave }: {
  open: boolean; editing: Template | null; onClose: () => void; onSave: (t: Template) => void
}) {
  const [form, setForm] = React.useState({ name: "", category: "custom" as Category, message: "" })
  const [aiLoading, setAiLoading] = React.useState(false)

  React.useEffect(() => {
    if (editing) {
      setForm({ name: editing.name, category: editing.category, message: editing.message })
    } else {
      setForm({ name: "", category: "custom", message: "" })
    }
  }, [editing, open])

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(f => ({ ...f, [k]: v }))

  const generateAI = () => {
    if (!form.category) return
    setAiLoading(true)
    setTimeout(() => {
      setForm(f => ({ ...f, message: AI_SUGGESTIONS[f.category] ?? AI_SUGGESTIONS.custom }))
      setAiLoading(false)
      toast({ title: "AI template generated!", description: "Customize the placeholders for your brand." })
    }, 1400)
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.message.trim()) {
      toast({ title: "Fill in name and message to save" })
      return
    }
    onSave({
      id: editing?.id ?? `custom-${Date.now()}`,
      name: form.name,
      category: form.category,
      message: form.message,
      uses: editing?.uses ?? 0,
      isFavorite: editing?.isFavorite,
      isCustom: true,
    })
    onClose()
    toast({ title: editing ? "Template updated!" : "Template created!", description: form.name })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="w-full max-w-lg bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="font-display font-bold text-base">{editing ? "Edit Template" : "Create Template"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Build a reusable WhatsApp message</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted"><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Template name *</label>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="e.g. Payment Confirmed"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([cat, cfg]) => (
                    <button key={cat} onClick={() => set("category", cat)}
                      className={cn("flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all",
                        form.category === cat ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-border hover:bg-muted text-muted-foreground")}>
                      <cfg.icon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Message *</label>
                  <button onClick={generateAI} disabled={aiLoading}
                    className="flex items-center gap-1 text-[11px] font-semibold text-brand-purple hover:underline disabled:opacity-50">
                    {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {aiLoading ? "Generating…" : "Generate with AI"}
                  </button>
                </div>
                <textarea value={form.message} onChange={e => set("message", e.target.value)}
                  rows={7} placeholder="Hi {name}! ..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none font-mono" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Use placeholders like <code className="bg-muted px-1 rounded text-[9px]">{"{"+"name}"}</code>, <code className="bg-muted px-1 rounded text-[9px]">{"{"+"product}"}</code>, <code className="bg-muted px-1 rounded text-[9px]">{"{"+"amount}"}</code>, etc.
                </p>
              </div>

              {/* Preview */}
              {form.message && (
                <div className="rounded-xl bg-[#25D366]/5 border border-[#25D366]/15 p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Preview</p>
                  <p className="text-xs whitespace-pre-line leading-relaxed">{form.message}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 p-5 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 gap-1.5" onClick={handleSave}>
                <Zap className="h-4 w-4" />
                {editing ? "Save changes" : "Create template"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function TemplatesPage() {
  const [templates, setTemplates] = React.useState<Template[]>(INITIAL_TEMPLATES)
  const [search, setSearch] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState<Category | "all" | "favorites">("all")
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingTemplate, setEditingTemplate] = React.useState<Template | null>(null)

  const filtered = templates.filter(t => {
    if (activeCategory === "favorites" && !t.isFavorite) return false
    if (activeCategory !== "all" && activeCategory !== "favorites" && t.category !== activeCategory) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.message.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleCopy = (t: Template) => {
    setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, uses: x.uses + 1 } : x))
    toast({ title: "Template copied!", description: "Paste into WhatsApp and customize the placeholders." })
  }

  const handleToggleFavorite = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isFavorite: !t.isFavorite } : t))
  }

  const handleSave = (t: Template) => {
    setTemplates(prev => {
      const exists = prev.find(x => x.id === t.id)
      return exists ? prev.map(x => x.id === t.id ? t : x) : [t, ...prev]
    })
  }

  const openCreate = () => { setEditingTemplate(null); setModalOpen(true) }
  const openEdit = (t: Template) => { setEditingTemplate(t); setModalOpen(true) }

  const totalUses = templates.reduce((s, t) => s + t.uses, 0)
  const favCount = templates.filter(t => t.isFavorite).length

  return (
    <div className="p-4 sm:p-6 space-y-5 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold">WhatsApp Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quick-reply library for every customer scenario</p>
        </div>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Templates", value: templates.length, icon: MessageCircle, color: "text-brand-purple", bg: "bg-brand-purple/10" },
          { label: "Total Uses",  value: totalUses.toLocaleString(), icon: ExternalLink, color: "text-brand-green",  bg: "bg-brand-green/10" },
          { label: "Saved",       value: favCount,        icon: Heart,        color: "text-brand-coral",  bg: "bg-brand-coral/10"  },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-border bg-card p-4">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl mb-2", s.bg)}>
              <s.icon className={cn("h-4 w-4", s.color)} />
            </div>
            <p className="font-display text-xl font-extrabold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search templates…"
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setActiveCategory("all")}
          className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
            activeCategory === "all" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
          All ({templates.length})
        </button>
        <button onClick={() => setActiveCategory("favorites")}
          className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1",
            activeCategory === "favorites" ? "bg-brand-coral/10 border-brand-coral/20 text-brand-coral" : "border-border text-muted-foreground hover:text-foreground")}>
          <Heart className="h-3 w-3" /> Saved ({favCount})
        </button>
        {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([cat, cfg]) => {
          const count = templates.filter(t => t.category === cat).length
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5",
                activeCategory === cat ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-border text-muted-foreground hover:text-foreground")}>
              <span className="hidden sm:inline">{cfg.label}</span>
              <span className="sm:hidden"><cfg.icon className="h-3 w-3" /></span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Templates grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-sm text-muted-foreground">No templates found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? `No results for "${search}"` : "Create your first template to get started"}
          </p>
          <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Create template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {filtered.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}>
                <TemplateCard template={t} onCopy={handleCopy} onToggleFavorite={handleToggleFavorite} onEdit={openEdit} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Placeholder tip */}
      <div className="rounded-2xl border border-brand-purple/15 bg-brand-purple/5 p-4 flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-brand-purple flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-brand-purple">Template placeholders</p>
          <p className="text-xs text-muted-foreground mt-1">
            Replace{" "}
            {["{name}", "{product}", "{amount}", "{orderId}", "{tracking}", "{eta}", "{code}", "{discount}"].map(p => (
              <code key={p} className="bg-brand-purple/10 text-brand-purple px-1 py-0.5 rounded text-[9px] mx-0.5">{p}</code>
            ))}
            {" "}with your customer's actual details before sending.
          </p>
        </div>
      </div>

      <CreateModal open={modalOpen} editing={editingTemplate} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  )
}
