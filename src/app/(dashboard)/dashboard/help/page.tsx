"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Search,
  BookOpen,
  MessageCircle,
  Video,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  ArrowRight,
  ExternalLink,
  Zap,
  ShoppingBag,
  ClipboardList,
  Bot,
  BarChart3,
  Users,
  Megaphone,
  Store,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Data ─────────────────────────────────────────────────────────────────────

interface FAQ {
  q: string
  a: string
}

interface GuideSection {
  icon: React.ElementType
  title: string
  color: string
  bg: string
  href: string
  steps: string[]
}

const FAQ_ITEMS: FAQ[] = [
  { q: "How do I connect my WhatsApp number?",          a: "Go to Settings → Profile, enter your WhatsApp number in the Phone/WhatsApp field, and save. Your store's 'Order' buttons will automatically generate pre-filled messages to that number." },
  { q: "Can I sell digital products?",                  a: "Yes! Add a product and select 'Digital' as the category. You can include a download link or delivery instructions in the product description. Payment and delivery coordination happens via WhatsApp." },
  { q: "How do customers find my store?",               a: "Share your store link (lummy.co/your-handle) in your Instagram bio, TikTok profile, WhatsApp status, and anywhere you promote your business. You can also use the dedicated link-in-bio page at lummy.co/your-handle/links." },
  { q: "Is there a transaction fee?",                   a: "Lummy charges zero transaction fees. You keep 100% of what you earn. We only charge a flat monthly subscription for the platform." },
  { q: "What happens when someone orders?",             a: "Customers click 'Order via WhatsApp' and a pre-filled message is sent directly to your WhatsApp. You confirm, arrange payment (bank transfer, Opay, etc.), and coordinate delivery — all in WhatsApp." },
  { q: "Can I have multiple stores?",                   a: "Each Lummy account is tied to one store. If you manage multiple brands, you'll need a separate account for each. Contact support if you need a multi-brand setup." },
  { q: "How do I track my revenue?",                    a: "The Analytics page shows monthly revenue, weekly conversion funnels, traffic sources, and top product performance. Mark orders as delivered in the Orders page to keep your data accurate." },
  { q: "Can I customise my store colours?",             a: "Store customisation (colours, fonts, layout) is available on the Pro plan. On Growth, you can customise your cover photo, avatar, bio, and social links." },
  { q: "How does the AI Assistant work?",               a: "Lummy AI is powered by Claude (Anthropic). It helps you write product descriptions, Instagram captions, restock messages, and campaign briefs. Just type what you need on the AI Assistant page." },
  { q: "What is the Refer & Earn programme?",           a: "Share your referral link with other creators. When they sign up and go live, you earn cash bonuses (₦5k–₦100k) and free plan months based on how many active referrals you have." },
]

const GUIDES: GuideSection[] = [
  {
    icon: Store,
    title: "Set up your store",
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
    href: "/dashboard/store",
    steps: ["Upload a cover photo and profile photo", "Write a compelling bio", "Add your WhatsApp number", "Set your Instagram and TikTok handles"],
  },
  {
    icon: ShoppingBag,
    title: "Add your first product",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
    href: "/dashboard/products",
    steps: ["Click 'Add Product' on the Products page", "Upload a high-quality product image", "Set your price and stock quantity", "Toggle WhatsApp ordering on and publish"],
  },
  {
    icon: ClipboardList,
    title: "Manage orders",
    color: "text-brand-coral",
    bg: "bg-brand-coral/10",
    href: "/dashboard/orders",
    steps: ["View all orders on the Orders page", "Click any row to open order details", "Use 'Mark as Confirmed/Shipped' to update status", "Notify customers via WhatsApp with one tap"],
  },
  {
    icon: Megaphone,
    title: "Send a broadcast",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    href: "/dashboard/broadcast",
    steps: ["Choose your customer segment to target", "Pick a message template or write your own", "Use {firstName} to personalise each message", "Preview and send to your selected customers"],
  },
  {
    icon: Bot,
    title: "Use Lummy AI",
    color: "text-brand-indigo",
    bg: "bg-brand-indigo/10",
    href: "/dashboard/ai",
    steps: ["Open the AI Assistant page", "Pick a quick prompt or type your request", "Get captions, descriptions, and campaign briefs", "Copy the output and post directly"],
  },
  {
    icon: BarChart3,
    title: "Read your analytics",
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
    href: "/dashboard/analytics",
    steps: ["Check monthly revenue trends on the chart", "Monitor your top-performing products", "See which channels drive the most orders", "Use insights to plan your next campaign"],
  },
]

const VIDEO_TUTORIALS = [
  { title: "Getting started with Lummy",       duration: "3:45", thumb: "🎬" },
  { title: "Setting up WhatsApp commerce",     duration: "5:12", thumb: "📱" },
  { title: "Adding & managing products",       duration: "4:28", thumb: "🛍️" },
  { title: "Using Lummy AI for content",       duration: "6:01", thumb: "✨" },
  { title: "Reading your analytics",           duration: "3:52", thumb: "📊" },
  { title: "Growing with the referral programme", duration: "2:38", thumb: "💜" },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function FAQItem({ item }: { item: FAQ }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className={cn("border-b border-border last:border-0", open && "pb-3")}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <p className="text-sm font-semibold">{item.q}</p>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-1"
        >
          <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
        </motion.div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [search, setSearch] = React.useState("")
  const [copied, setCopied] = React.useState(false)

  const filteredFAQ = FAQ_ITEMS.filter(
    item =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
  )

  const copyEmail = () => {
    navigator.clipboard.writeText("hello@lummy.co")
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold">Help & Docs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Everything you need to get the most from Lummy</p>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search FAQs…"
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
        />
      </div>

      {/* Getting started guides */}
      {!search && (
        <section>
          <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand-purple" />
            Getting started
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GUIDES.map((guide, i) => (
              <motion.div
                key={guide.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={guide.href}
                  className="block rounded-2xl border border-border bg-card p-4 hover:border-brand-purple/20 hover:bg-accent/50 transition-all group"
                >
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
                        <CheckCheck className="h-3 w-3 text-brand-green flex-shrink-0 mt-0.5" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Video tutorials */}
      {!search && (
        <section>
          <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
            <Video className="h-4 w-4 text-brand-coral" />
            Video tutorials
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {VIDEO_TUTORIALS.map((vid, i) => (
              <motion.button
                key={vid.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border bg-card p-3 text-left hover:border-brand-purple/20 hover:bg-accent/50 transition-all group"
              >
                <div className="text-3xl mb-2">{vid.thumb}</div>
                <p className="text-xs font-semibold leading-snug line-clamp-2">{vid.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Video className="h-2.5 w-2.5" />
                  {vid.duration}
                </p>
              </motion.button>
            ))}
          </div>
        </section>
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
              <p className="text-sm">No FAQs match "{search}"</p>
            </div>
          ) : (
            filteredFAQ.map((item, i) => <FAQItem key={i} item={item} />)
          )}
        </div>
      </section>

      {/* Contact support */}
      <section>
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-purple/10 flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-brand-purple" />
            </div>
            <div>
              <p className="text-sm font-semibold">Still need help?</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Our support team is available Mon–Sat, 9am–6pm WAT. Average response time: under 2 hours.
              </p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                <a
                  href="https://wa.me/2348000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 text-xs font-semibold hover:bg-[#25D366]/20 transition-colors"
                >
                  <MessageCircle className="h-3 w-3 fill-[#25D366]" />
                  Chat on WhatsApp
                </a>
                <button
                  onClick={copyEmail}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-accent transition-colors"
                >
                  {copied ? <CheckCheck className="h-3 w-3 text-brand-green" /> : null}
                  {copied ? "Copied!" : "hello@lummy.co"}
                </button>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground mb-1">Current status</p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-green">
              <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
              All systems operational
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
