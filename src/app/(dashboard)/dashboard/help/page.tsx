"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, BookOpen, MessageCircle, Video, ChevronDown, ChevronUp,
  CheckCheck, ArrowRight, ShoppingBag, ClipboardList, Bot,
  BarChart3, Megaphone, Store, Star, Sparkles, Keyboard,
  Zap, Globe, Shield, CreditCard, Bell, Send, ChevronRight,
  Check, X, FileText, Lightbulb, ThumbsUp, ThumbsDown,
  Trophy, Circle, AlertTriangle, ArrowUp, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

// ─── Types ────────────────────────────────────────────────────────────────────

interface FAQ { q: string; a: string; tags: string[] }
interface GuideSection { icon: React.ElementType; title: string; color: string; bg: string; href: string; steps: string[] }
interface ChangelogItem { version: string; date: string; tag: "new" | "improved" | "fix"; title: string; body: string }
interface ArticleCategory { id: string; icon: React.ElementType; label: string; color: string; bg: string; count: number }
interface Shortcut { keys: string[]; desc: string }
interface OnboardingTask { id: string; label: string; href: string; icon: React.ElementType }
interface ServiceStatus { id: string; name: string; status: "operational" | "degraded" | "outage"; latency: string }
interface FeatureRequest { id: string; title: string; category: string; votes: number }

// ─── Data ─────────────────────────────────────────────────────────────────────

const ONBOARDING_TASKS: OnboardingTask[] = [
  { id: "profile_photo", label: "Upload a profile photo",        href: "/dashboard/store",    icon: Store },
  { id: "cover_photo",   label: "Add a cover photo",             href: "/dashboard/store",    icon: Store },
  { id: "whatsapp",      label: "Connect your WhatsApp number",  href: "/dashboard/settings", icon: MessageCircle },
  { id: "first_product", label: "Add your first product",        href: "/dashboard/products", icon: ShoppingBag },
  { id: "bio",           label: "Write your store bio",          href: "/dashboard/store",    icon: FileText },
  { id: "share_link",   label: "Share your store link",          href: "/dashboard/store",    icon: ArrowRight },
]

const SYSTEM_SERVICES: ServiceStatus[] = [
  { id: "platform",  name: "Lummy Platform",        status: "operational", latency: "42ms"  },
  { id: "payments",  name: "Paystack Payments",      status: "operational", latency: "87ms"  },
  { id: "whatsapp",  name: "WhatsApp Business API",  status: "degraded",    latency: "312ms" },
  { id: "logistics", name: "GIG Logistics API",      status: "operational", latency: "156ms" },
]

const INITIAL_FEATURE_REQUESTS: FeatureRequest[] = [
  { id: "fr1", title: "WhatsApp catalogue sync",              category: "integrations", votes: 124 },
  { id: "fr2", title: "Recurring payments & subscriptions",   category: "payments",     votes: 89  },
  { id: "fr3", title: "Bundle pricing for product sets",      category: "products",     votes: 76  },
  { id: "fr4", title: "Multi-language storefront",            category: "store",        votes: 54  },
  { id: "fr5", title: "WhatsApp chatbot for order tracking",  category: "orders",       votes: 47  },
]

const FAQ_ITEMS: FAQ[] = [
  { q: "How do I connect my WhatsApp number?", tags: ["whatsapp", "setup"],
    a: "Go to Settings → Profile, enter your WhatsApp number in the Phone/WhatsApp field, and save. Your store's 'Order' buttons will automatically generate pre-filled messages to that number." },
  { q: "Can I sell digital products?", tags: ["products", "digital"],
    a: "Yes! Add a product and select 'Digital' as the category. You can include a download link or delivery instructions in the product description. Payment and delivery coordination happens via WhatsApp." },
  { q: "How do customers find my store?", tags: ["store", "marketing"],
    a: "Share your store link (lummy.co/your-handle) in your Instagram bio, TikTok profile, WhatsApp status, and anywhere you promote your business. You can also use the dedicated link-in-bio page at lummy.co/your-handle/links." },
  { q: "Is there a transaction fee?", tags: ["billing", "fees"],
    a: "Lummy charges zero transaction fees. You keep 100% of what you earn. We only charge a flat monthly subscription for the platform." },
  { q: "What happens when someone orders?", tags: ["orders", "whatsapp"],
    a: "Customers click 'Order via WhatsApp' and a pre-filled message is sent directly to your WhatsApp. You confirm, arrange payment (bank transfer, Opay, etc.), and coordinate delivery — all in WhatsApp." },
  { q: "Can I have multiple stores?", tags: ["account", "setup"],
    a: "Each Lummy account is tied to one store. If you manage multiple brands, you'll need a separate account for each. Contact support if you need a multi-brand setup." },
  { q: "How do I track my revenue?", tags: ["analytics", "revenue"],
    a: "The Analytics page shows monthly revenue, weekly conversion funnels, traffic sources, and top product performance. Mark orders as delivered in the Orders page to keep your data accurate." },
  { q: "Can I customise my store colours?", tags: ["store", "customization"],
    a: "Store customisation (colours, fonts, layout) is available on the Pro plan. On Growth, you can customise your cover photo, avatar, bio, and social links." },
  { q: "How does the AI Assistant work?", tags: ["ai", "features"],
    a: "Lummy AI is powered by Claude (Anthropic). It helps you write product descriptions, Instagram captions, restock messages, and campaign briefs. Just type what you need on the AI Assistant page." },
  { q: "What is the Refer & Earn programme?", tags: ["referrals", "billing"],
    a: "Share your referral link with other creators. When they sign up and go live, you earn cash bonuses (₦5k–₦100k) and free plan months based on how many active referrals you have." },
  { q: "How do payouts work?", tags: ["payouts", "billing"],
    a: "Payouts are processed every Tuesday and Friday. The minimum withdrawal is ₦5,000 with a 1.5% processing fee (capped at ₦1,500). Funds arrive in your bank account within 1–2 business days." },
  { q: "Can I set business hours?", tags: ["store", "setup"],
    a: "Yes — go to Store → Store Info and enable Business Hours. You can set opening and closing times for each day of the week, and your storefront will show your availability to customers." },
]

const GUIDES: GuideSection[] = [
  { icon: Store, title: "Set up your store", color: "text-brand-purple", bg: "bg-brand-purple/10", href: "/dashboard/store",
    steps: ["Upload a cover photo and profile photo", "Write a compelling bio", "Add your WhatsApp number", "Set your Instagram and TikTok handles"] },
  { icon: ShoppingBag, title: "Add your first product", color: "text-brand-green", bg: "bg-brand-green/10", href: "/dashboard/products",
    steps: ["Click 'Add Product' on the Products page", "Upload a high-quality product image", "Set your price and stock quantity", "Toggle WhatsApp ordering on and publish"] },
  { icon: ClipboardList, title: "Manage orders", color: "text-brand-coral", bg: "bg-brand-coral/10", href: "/dashboard/orders",
    steps: ["View all orders on the Orders page", "Click any row to open order details", "Use 'Mark as Confirmed/Shipped' to update status", "Notify customers via WhatsApp with one tap"] },
  { icon: Megaphone, title: "Send a broadcast", color: "text-amber-500", bg: "bg-amber-500/10", href: "/dashboard/broadcast",
    steps: ["Choose your customer segment to target", "Pick a message template or write your own", "Use {firstName} to personalise each message", "Preview and send to your selected customers"] },
  { icon: Bot, title: "Use Lummy AI", color: "text-brand-indigo", bg: "bg-brand-indigo/10", href: "/dashboard/ai",
    steps: ["Open the AI Assistant page", "Pick a quick prompt or type your request", "Get captions, descriptions, and campaign briefs", "Copy the output and post directly"] },
  { icon: BarChart3, title: "Read your analytics", color: "text-brand-purple", bg: "bg-brand-purple/10", href: "/dashboard/analytics",
    steps: ["Check monthly revenue trends on the chart", "Monitor your top-performing products", "See which channels drive the most orders", "Use insights to plan your next campaign"] },
]

const VIDEO_TUTORIALS = [
  { title: "Getting started with Lummy",          duration: "3:45", thumb: "🎬" },
  { title: "Setting up WhatsApp commerce",        duration: "5:12", thumb: "📱" },
  { title: "Adding & managing products",          duration: "4:28", thumb: "🛍️" },
  { title: "Using Lummy AI for content",          duration: "6:01", thumb: "✨" },
  { title: "Reading your analytics",              duration: "3:52", thumb: "📊" },
  { title: "Growing with the referral programme", duration: "2:38", thumb: "💜" },
]

const CHANGELOG: ChangelogItem[] = [
  { version: "2.8", date: "May 10, 2026", tag: "new",      title: "Store Customizer",       body: "Full schema-driven store editor with live preview, 6 theme presets, and 10 section types." },
  { version: "2.7", date: "Apr 28, 2026", tag: "improved", title: "AI Weekly Brief",        body: "AI-generated weekly digest now includes pricing recommendations based on market data." },
  { version: "2.7", date: "Apr 28, 2026", tag: "new",      title: "Referral Earnings Chart", body: "Earnings chart and commission breakdown added to the Refer & Earn page." },
  { version: "2.6", date: "Apr 15, 2026", tag: "improved", title: "Reports: AI Insights",   body: "Each report type now surfaces 3 AI-generated insights with success/warning/tip categories." },
  { version: "2.5", date: "Mar 30, 2026", tag: "new",      title: "Product Bundles",        body: "Create and sell product bundles with flexible pricing. Bundle analytics now tracked separately." },
  { version: "2.4", date: "Mar 12, 2026", tag: "fix",      title: "Broadcast delivery",     body: "Fixed an issue where broadcast messages to segments >500 customers could be truncated." },
]

const ARTICLE_CATEGORIES: ArticleCategory[] = [
  { id: "getting-started", icon: Zap,        label: "Getting started",    color: "text-brand-purple", bg: "bg-brand-purple/10", count: 8  },
  { id: "store",           icon: Store,       label: "Store & products",   color: "text-brand-green",  bg: "bg-brand-green/10",  count: 12 },
  { id: "orders",          icon: ShoppingBag, label: "Orders & shipping",  color: "text-brand-coral",  bg: "bg-brand-coral/10",  count: 9  },
  { id: "payments",        icon: CreditCard,  label: "Payments & payouts", color: "text-amber-500",    bg: "bg-amber-500/10",    count: 7  },
  { id: "ai",              icon: Bot,         label: "AI & automation",    color: "text-brand-indigo", bg: "bg-brand-indigo/10", count: 6  },
  { id: "integrations",    icon: Globe,       label: "Integrations",       color: "text-blue-500",     bg: "bg-blue-500/10",     count: 5  },
  { id: "billing",         icon: Shield,      label: "Account & billing",  color: "text-brand-purple", bg: "bg-brand-purple/10", count: 6  },
  { id: "notifications",   icon: Bell,        label: "Notifications",      color: "text-brand-green",  bg: "bg-brand-green/10",  count: 4  },
]

const KEYBOARD_SHORTCUTS: { group: string; shortcuts: Shortcut[] }[] = [
  { group: "Navigation", shortcuts: [
    { keys: ["G", "H"], desc: "Go to Dashboard" }, { keys: ["G", "O"], desc: "Go to Orders" },
    { keys: ["G", "P"], desc: "Go to Products" }, { keys: ["G", "C"], desc: "Go to Customers / CRM" },
    { keys: ["G", "A"], desc: "Go to Analytics" },
  ]},
  { group: "Quick actions", shortcuts: [
    { keys: ["N", "P"], desc: "New product" }, { keys: ["N", "O"], desc: "New order" },
    { keys: ["⌘", "K"], desc: "Open command palette" }, { keys: ["⌘", "/"], desc: "Toggle search" },
  ]},
  { group: "General", shortcuts: [
    { keys: ["?"],      desc: "Show keyboard shortcuts" },
    { keys: ["Esc"],    desc: "Close modal / go back" },
    { keys: ["⌘", "S"], desc: "Save changes" },
  ]},
]

const TAG_COLORS: Record<string, string> = {
  new:      "bg-brand-green/10 text-brand-green",
  improved: "bg-brand-purple/10 text-brand-purple",
  fix:      "bg-amber-500/10 text-amber-500",
}

const STATUS_CONFIG: Record<ServiceStatus["status"], { dot: string; label: string; bg: string }> = {
  operational: { dot: "bg-brand-green",  label: "Operational", bg: "bg-brand-green/10"  },
  degraded:    { dot: "bg-amber-400",    label: "Degraded",    bg: "bg-amber-500/10"     },
  outage:      { dot: "bg-red-500",      label: "Outage",      bg: "bg-red-500/10"       },
}

const ONBOARDING_KEY   = "lummy_onboarding_v1"
const FEATURE_VOTES_KEY = "lummy_feature_votes_v1"

// ─── Sub-components ───────────────────────────────────────────────────────────

function FAQItem({ item }: { item: FAQ }) {
  const [open, setOpen] = React.useState(false)
  const [helpful, setHelpful] = React.useState<"up" | "down" | null>(null)

  return (
    <div className={cn("border-b border-border last:border-0", open && "pb-3")}>
      <button onClick={() => setOpen(v => !v)} className="flex w-full items-center justify-between gap-4 py-4 text-left">
        <p className="text-sm font-semibold">{item.q}</p>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="pb-1">
          <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-1.5 flex-wrap">
              {item.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">{tag}</span>
              ))}
            </div>
            {helpful === null ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-muted-foreground">Helpful?</span>
                <button onClick={() => { setHelpful("up"); toast({ title: "Thanks for the feedback!" }) }}
                  className="p-1 rounded-lg hover:bg-brand-green/10 text-muted-foreground hover:text-brand-green transition-colors">
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { setHelpful("down"); toast({ title: "We'll work on improving this." }) }}
                  className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                {helpful === "up"
                  ? <><ThumbsUp className="h-3 w-3 text-brand-green" /> Glad that helped!</>
                  : <><ThumbsDown className="h-3 w-3 text-red-400" /> Feedback noted</>}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

function ShortcutKey({ k }: { k: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[22px] h-5.5 px-1.5 rounded-md border border-border bg-muted text-[10px] font-semibold font-mono shadow-sm">{k}</kbd>
  )
}

function OnboardingChecklist() {
  const [done, setDone] = React.useState<Set<string>>(new Set())
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_KEY)
      setDone(raw ? new Set(JSON.parse(raw) as string[]) : new Set())
    } catch {}
  }, [])

  const toggle = (id: string) => {
    setDone(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      try { localStorage.setItem(ONBOARDING_KEY, JSON.stringify(Array.from(next))) } catch {}
      return next
    })
  }

  const pct = Math.round((done.size / ONBOARDING_TASKS.length) * 100)
  const allDone = done.size === ONBOARDING_TASKS.length

  if (dismissed || allDone) return null

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-brand-purple" />
          <p className="text-sm font-bold text-brand-purple">Get your store ready</p>
          <span className="text-[10px] font-semibold text-muted-foreground">{done.size}/{ONBOARDING_TASKS.length} done</span>
        </div>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="h-1.5 rounded-full bg-brand-purple/15 overflow-hidden mb-4">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full bg-brand-purple" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ONBOARDING_TASKS.map(task => {
          const isDone = done.has(task.id)
          return (
            <button key={task.id} onClick={() => toggle(task.id)}
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
                isDone ? "border-brand-purple/20 bg-brand-purple/5 opacity-60" : "border-border bg-card hover:border-brand-purple/25 hover:bg-brand-purple/5"
              )}>
              <div className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2 flex-shrink-0 transition-all",
                isDone ? "border-brand-purple bg-brand-purple" : "border-border")}>
                {isDone && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              <span className={cn("text-xs font-semibold flex-1", isDone && "line-through")}>{task.label}</span>
              {!isDone && <Link href={task.href} onClick={e => e.stopPropagation()}
                className="text-[10px] font-semibold text-brand-purple hover:underline flex-shrink-0">Go →</Link>}
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

function SystemStatusPanel() {
  const [expanded, setExpanded] = React.useState(false)
  const anyIssue = SYSTEM_SERVICES.some(s => s.status !== "operational")

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-7 w-7 items-center justify-center rounded-xl",
            anyIssue ? "bg-amber-500/10" : "bg-brand-green/10")}>
            <Globe className={cn("h-3.5 w-3.5", anyIssue ? "text-amber-500" : "text-brand-green")} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">System Status</p>
            <p className={cn("text-[10px] font-semibold", anyIssue ? "text-amber-500" : "text-brand-green")}>
              {anyIssue ? "Minor issue detected" : "All systems operational"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full flex-shrink-0", anyIssue ? "bg-amber-400 animate-pulse" : "bg-brand-green")} />
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="overflow-hidden border-t border-border">
            <div className="divide-y divide-border">
              {SYSTEM_SERVICES.map(svc => {
                const cfg = STATUS_CONFIG[svc.status]
                return (
                  <div key={svc.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("h-2 w-2 rounded-full flex-shrink-0", cfg.dot,
                        svc.status !== "operational" && "animate-pulse")} />
                      <p className="text-xs font-semibold">{svc.name}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />{svc.latency}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full font-semibold", cfg.bg,
                        svc.status === "operational" ? "text-brand-green" : svc.status === "degraded" ? "text-amber-500" : "text-red-500")}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            {anyIssue && (
              <div className="px-5 py-3 border-t border-border bg-amber-500/5">
                <p className="text-[10px] text-amber-600 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  WhatsApp API is experiencing elevated latency. Broadcast delivery may be delayed by 5–10 minutes.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FeatureRequestBoard() {
  const [requests, setRequests] = React.useState<(FeatureRequest & { voted: boolean })[]>(
    INITIAL_FEATURE_REQUESTS.map(r => ({ ...r, voted: false }))
  )
  const [newRequest, setNewRequest] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    try {
      const voted = new Set(JSON.parse(localStorage.getItem(FEATURE_VOTES_KEY) ?? "[]") as string[])
      setRequests(INITIAL_FEATURE_REQUESTS.map(r => ({ ...r, voted: voted.has(r.id) })))
    } catch {}
  }, [])

  const vote = (id: string) => {
    setRequests(prev => {
      const next = prev.map(r => r.id === id ? { ...r, votes: r.voted ? r.votes - 1 : r.votes + 1, voted: !r.voted } : r)
      try {
        const voted = next.filter(r => r.voted).map(r => r.id)
        localStorage.setItem(FEATURE_VOTES_KEY, JSON.stringify(voted))
      } catch {}
      return next.sort((a, b) => b.votes - a.votes)
    })
  }

  const submitRequest = () => {
    if (!newRequest.trim()) return
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setNewRequest("")
      toast({ title: "Feature request submitted!", description: "We review all suggestions weekly.", variant: "success" })
    }, 800)
  }

  return (
    <section>
      <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
        <ArrowUp className="h-4 w-4 text-brand-purple" />
        Feature requests
        <span className="text-xs font-normal text-muted-foreground ml-1">— vote for what you want built next</span>
      </h2>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {requests.map((req, i) => (
            <motion.div key={req.id} layout
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/30 transition-colors">
              <button onClick={() => vote(req.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 min-w-[40px] py-1.5 px-2 rounded-xl border text-xs font-bold transition-all",
                  req.voted
                    ? "border-brand-purple/30 bg-brand-purple/10 text-brand-purple"
                    : "border-border text-muted-foreground hover:border-brand-purple/25 hover:text-brand-purple"
                )}>
                <ArrowUp className="h-3 w-3" />
                {req.votes}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{req.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{req.category}</p>
              </div>
              {req.voted && (
                <span className="text-[10px] font-semibold text-brand-purple flex-shrink-0">Voted</span>
              )}
            </motion.div>
          ))}
        </div>
        <div className="border-t border-border p-4">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2">Suggest a feature</p>
          <div className="flex gap-2">
            <input value={newRequest} onChange={e => setNewRequest(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitRequest()}
              placeholder="What would you like us to build?"
              className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
            <Button size="sm" className="h-9 text-xs gap-1.5" onClick={submitRequest}
              disabled={!newRequest.trim() || submitting}>
              {submitting ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [search, setSearch] = React.useState("")
  const [copied, setCopied] = React.useState(false)
  const [showShortcuts, setShowShortcuts] = React.useState(false)
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null)
  const [ticketName, setTicketName] = React.useState("")
  const [ticketEmail, setTicketEmail] = React.useState("")
  const [ticketBody, setTicketBody] = React.useState("")
  const [ticketSent, setTicketSent] = React.useState(false)
  const [ticketRef, setTicketRef] = React.useState("")
  const [changelogExpanded, setChangelogExpanded] = React.useState(false)

  const filteredFAQ = FAQ_ITEMS.filter(item => {
    const q = search.toLowerCase()
    if (!q) return true
    return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q) || item.tags.some(t => t.includes(q))
  })

  const copyEmail = () => {
    navigator.clipboard.writeText("hello@lummy.co")
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketName.trim() || !ticketEmail.trim() || !ticketBody.trim()) return
    const ref = `TKT-${Math.floor(1000 + Math.random() * 9000)}`
    setTicketRef(ref)
    setTicketSent(true)
    toast({ title: "Support ticket submitted", description: `Reference: ${ref}`, variant: "success" })
  }

  const visibleChangelog = changelogExpanded ? CHANGELOG : CHANGELOG.slice(0, 3)

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Help & Docs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Everything you need to get the most from Lummy</p>
        </div>
        <Button size="sm" variant="outline"
          className={cn("gap-1.5 h-9", showShortcuts && "bg-brand-purple/10 border-brand-purple/30 text-brand-purple")}
          onClick={() => setShowShortcuts(v => !v)}>
          <Keyboard className="h-3.5 w-3.5" /> Shortcuts
        </Button>
      </div>

      {/* Keyboard shortcuts panel */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4 text-brand-purple" />
                  <p className="text-sm font-bold text-brand-purple">Keyboard Shortcuts</p>
                </div>
                <button onClick={() => setShowShortcuts(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {KEYBOARD_SHORTCUTS.map(group => (
                  <div key={group.group}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">{group.group}</p>
                    <div className="space-y-2">
                      {group.shortcuts.map((sc, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{sc.desc}</span>
                          <div className="flex items-center gap-0.5">{sc.keys.map((k, j) => <ShortcutKey key={j} k={k} />)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding checklist */}
      {!search && <OnboardingChecklist />}

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search guides, FAQs, articles…"
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!search && (
        <>
          {/* What's new */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-purple" /> What&apos;s new
              </h2>
              <button onClick={() => setChangelogExpanded(v => !v)} className="text-xs text-brand-purple hover:underline">
                {changelogExpanded ? "Show less" : `See all ${CHANGELOG.length} updates`}
              </button>
            </div>
            <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
              <AnimatePresence initial={false}>
                {visibleChangelog.map((item) => (
                  <motion.div key={item.title} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-4 px-5 py-3.5 hover:bg-accent/30 transition-colors">
                    <div className="flex-shrink-0 pt-0.5">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", TAG_COLORS[item.tag])}>{item.tag}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">v{item.version}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.body}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">{item.date}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* Article categories */}
          <section>
            <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-green" /> Browse by topic
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ARTICLE_CATEGORIES.map((cat, i) => (
                <motion.button key={cat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={cn("rounded-2xl border p-3.5 text-left transition-all hover:border-foreground/15",
                    activeCategory === cat.id ? `${cat.bg} ${cat.color.replace("text-", "border-")}` : "border-border bg-card")}>
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-2.5", cat.bg)}>
                    <cat.icon className={cn("h-4 w-4", cat.color)} />
                  </div>
                  <p className="text-xs font-semibold leading-tight">{cat.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{cat.count} articles</p>
                </motion.button>
              ))}
            </div>
            <AnimatePresence>
              {activeCategory && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3">
                  <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                    <Lightbulb className="h-4 w-4 text-brand-purple flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Full article library for <strong className="text-foreground">{ARTICLE_CATEGORIES.find(c => c.id === activeCategory)?.label}</strong> coming soon. For now, use the FAQ below or contact support.
                    </p>
                    <button onClick={() => setActiveCategory(null)} className="ml-auto text-muted-foreground hover:text-foreground flex-shrink-0"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Getting started guides */}
          <section>
            <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-brand-purple" /> Getting started
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {GUIDES.map((guide, i) => (
                <motion.div key={guide.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={guide.href} className="block rounded-2xl border border-border bg-card p-4 hover:border-brand-purple/20 hover:bg-accent/50 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0", guide.bg)}>
                        <guide.icon className={cn("h-4 w-4", guide.color)} />
                      </div>
                      <p className="text-sm font-semibold">{guide.title}</p>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <ul className="space-y-1.5">
                      {guide.steps.map((step, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCheck className="h-3 w-3 text-brand-green flex-shrink-0 mt-0.5" />{step}
                        </li>
                      ))}
                    </ul>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Video tutorials */}
          <section>
            <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
              <Video className="h-4 w-4 text-brand-coral" /> Video tutorials
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {VIDEO_TUTORIALS.map((vid, i) => (
                <motion.button key={vid.title} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                  className="rounded-2xl border border-border bg-card p-3 text-left hover:border-brand-purple/20 hover:bg-accent/50 transition-all group"
                  onClick={() => toast({ title: `Playing: ${vid.title}` })}>
                  <div className="text-3xl mb-2">{vid.thumb}</div>
                  <p className="text-xs font-semibold leading-snug line-clamp-2">{vid.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Video className="h-2.5 w-2.5" />{vid.duration}</p>
                </motion.button>
              ))}
            </div>
          </section>
        </>
      )}

      {/* FAQ */}
      <section>
        <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          Frequently asked questions
          {search && <span className="text-sm font-normal text-muted-foreground ml-1">— {filteredFAQ.length} result{filteredFAQ.length !== 1 ? "s" : ""}</span>}
        </h2>
        <div className="rounded-2xl border border-border bg-card px-5">
          {filteredFAQ.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="h-6 w-6 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No FAQs match &quot;{search}&quot;</p>
              <button onClick={() => setSearch("")} className="text-xs text-brand-purple hover:underline mt-1">Clear search</button>
            </div>
          ) : (
            filteredFAQ.map((item, i) => <FAQItem key={i} item={item} />)
          )}
        </div>
      </section>

      {/* Submit a ticket */}
      {!search && (
        <section>
          <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
            <Send className="h-4 w-4 text-brand-indigo" /> Submit a support ticket
          </h2>
          <div className="rounded-2xl border border-border bg-card p-5">
            <AnimatePresence mode="wait">
              {ticketSent ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-6 gap-3">
                  <div className="w-14 h-14 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center">
                    <Check className="h-7 w-7 text-brand-green" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Ticket submitted!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">We&apos;ll reply to {ticketEmail} within 2 hours (Mon–Sat, 9am–6pm WAT).</p>
                    {ticketRef && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <p className="text-[11px] text-muted-foreground">Reference:</p>
                        <code className="text-[11px] font-mono font-bold text-brand-purple bg-brand-purple/5 px-2 py-0.5 rounded-lg border border-brand-purple/15">{ticketRef}</code>
                        <button onClick={() => { navigator.clipboard.writeText(ticketRef); toast({ title: "Reference copied" }) }}
                          className="text-muted-foreground hover:text-foreground"><CheckCheck className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setTicketSent(false); setTicketName(""); setTicketEmail(""); setTicketBody("") }}>
                    Submit another
                  </Button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleTicketSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Your name</label>
                      <input value={ticketName} onChange={e => setTicketName(e.target.value)} required placeholder="Creator Name"
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Email address</label>
                      <input value={ticketEmail} onChange={e => setTicketEmail(e.target.value)} required type="email" placeholder="sade@example.com"
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Describe your issue</label>
                    <textarea value={ticketBody} onChange={e => setTicketBody(e.target.value)} required rows={4}
                      placeholder="What were you trying to do? What happened instead? Any error messages?"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none" />
                  </div>
                  <Button type="submit" className="gap-2 h-9" disabled={!ticketName.trim() || !ticketEmail.trim() || !ticketBody.trim()}>
                    <Send className="h-3.5 w-3.5" /> Send ticket
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* System status */}
      {!search && <SystemStatusPanel />}

      {/* Contact support */}
      <section>
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-purple/10 flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-brand-purple" />
            </div>
            <div>
              <p className="text-sm font-semibold">Still need help?</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Our support team is available Mon–Sat, 9am–6pm WAT. Average response time: under 2 hours.</p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                <a href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 text-xs font-semibold hover:bg-[#25D366]/20 transition-colors">
                  <MessageCircle className="h-3 w-3 fill-[#25D366]" /> Chat on WhatsApp
                </a>
                <button onClick={copyEmail}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-accent transition-colors">
                  {copied ? <CheckCheck className="h-3 w-3 text-brand-green" /> : null}
                  {copied ? "Copied!" : "hello@lummy.co"}
                </button>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground mb-1">Current status</p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Minor issue — WA API
            </div>
          </div>
        </div>
      </section>

      {/* Feature requests */}
      {!search && <FeatureRequestBoard />}
    </div>
  )
}
