"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageCircle,
  Users,
  Sparkles,
  Send,
  CheckCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  Package,
  Tag,
  Heart,
  Megaphone,
  AlertTriangle,
  Eye,
  RotateCcw,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type Segment = "all" | "vip" | "repeat" | "new" | "at-risk" | "inactive"

interface SegmentOption {
  id: Segment
  label: string
  count: number
  description: string
  color: string
  bg: string
}

interface MessageTemplate {
  id: string
  icon: React.ElementType
  label: string
  category: string
  body: string
}

interface BroadcastRecord {
  id: string
  message: string
  segment: string
  recipients: number
  sentAt: string
  delivered: number
  read: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const SEGMENTS: SegmentOption[] = [
  { id: "all",      label: "All customers",    count: 1247, description: "Your entire customer base",             color: "text-foreground",    bg: "bg-muted" },
  { id: "vip",      label: "VIP",              count: 89,   description: "Spent ₦50k+, 5+ orders",               color: "text-amber-500",     bg: "bg-amber-500/10" },
  { id: "repeat",   label: "Repeat buyers",    count: 412,  description: "2+ orders, actively buying",            color: "text-brand-purple",  bg: "bg-brand-purple/10" },
  { id: "new",      label: "New customers",    count: 234,  description: "First order in last 30 days",           color: "text-brand-green",   bg: "bg-brand-green/10" },
  { id: "at-risk",  label: "At risk",          count: 187,  description: "No order in 30–60 days",                color: "text-brand-coral",   bg: "bg-brand-coral/10" },
  { id: "inactive", label: "Inactive",         count: 325,  description: "No order in 60+ days",                  color: "text-muted-foreground", bg: "bg-muted" },
]

const TEMPLATES: MessageTemplate[] = [
  {
    id: "t1",
    icon: Tag,
    label: "New arrivals",
    category: "Product",
    body: "Hi {firstName}! 👋 We just dropped something you'll love at {storeName}.\n\n✨ New arrivals are now live — check them out before they sell out:\n👉 {storeUrl}\n\nLet me know if you want to order! 🛍",
  },
  {
    id: "t2",
    icon: Package,
    label: "Restock alert",
    category: "Product",
    body: "Hi {firstName}! 📦 Great news — {productName} is BACK IN STOCK at {storeName}!\n\nThis sold out fast last time, so don't wait:\n👉 {storeUrl}\n\nDM me to secure yours now! 💜",
  },
  {
    id: "t3",
    icon: Star,
    label: "Win back at-risk",
    category: "Re-engage",
    body: "Hi {firstName}! 👀 We miss you at {storeName}!\n\nIt's been a while since your last order. As a loyal customer, here's a special offer just for you:\n\n🎁 *10% off your next order* — just mention this message when you DM to order!\n\nOffer valid for 48 hours. 💜",
  },
  {
    id: "t4",
    icon: Heart,
    label: "Loyalty reward",
    category: "Retention",
    body: "Hi {firstName}! 💜 You're one of our top customers and we truly appreciate you!\n\nAs a thank-you, you've unlocked *VIP early access* to our next collection before anyone else.\n\nWant a sneak peek? Reply YES and I'll send you photos! ✨",
  },
  {
    id: "t5",
    icon: Megaphone,
    label: "Flash sale",
    category: "Promo",
    body: "⚡ FLASH SALE — {storeName}!\n\nHi {firstName}, for the next 24 HOURS only:\n\n🔥 Up to 30% off selected items\n🚚 Free delivery on orders above ₦15,000\n\nShop now: {storeUrl}\n\nSale ends midnight tonight! 🕛",
  },
  {
    id: "t6",
    icon: Star,
    label: "Review request",
    category: "Retention",
    body: "Hi {firstName}! 😊 Hope you're loving your recent order from {storeName}!\n\nWould you mind leaving us a quick review? It takes 30 seconds and means the world to us:\n\nJust reply to this message with a ⭐ rating and a short comment.\n\nThank you so much! 💜",
  },
]

const HISTORY: BroadcastRecord[] = [
  { id: "b1", message: "New arrivals just dropped! Check out the latest...", segment: "All customers", recipients: 1247, sentAt: "Dec 8, 2024 · 10:23am", delivered: 1189, read: 876 },
  { id: "b2", message: "Hi! We miss you at Sade's Store! It's been a while...", segment: "At risk", recipients: 187, sentAt: "Nov 30, 2024 · 3:15pm", delivered: 179, read: 134 },
  { id: "b3", message: "⚡ FLASH SALE — 24 hours only, up to 30% off...", segment: "VIP", recipients: 89, sentAt: "Nov 25, 2024 · 9:00am", delivered: 87, read: 82 },
  { id: "b4", message: "You're one of our top customers — VIP early access...", segment: "Repeat buyers", recipients: 412, sentAt: "Nov 15, 2024 · 2:00pm", delivered: 398, read: 301 },
]

// ─── Component ────────────────────────────────────────────────────────────────

const STORE_NAME = "Sade's Store"
const STORE_URL = "lummy.co/sade.styles"

function previewMessage(body: string, firstName = "Kemi") {
  return body
    .replace(/{firstName}/g, firstName)
    .replace(/{storeName}/g, STORE_NAME)
    .replace(/{storeUrl}/g, STORE_URL)
    .replace(/{productName}/g, "Ankara Print Dress")
}

export default function BroadcastPage() {
  const [selectedSegment, setSelectedSegment] = React.useState<Segment>("all")
  const [message, setMessage] = React.useState("")
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null)
  const [showTemplates, setShowTemplates] = React.useState(false)
  const [showPreview, setShowPreview] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [showHistory, setShowHistory] = React.useState(false)

  const segment = SEGMENTS.find(s => s.id === selectedSegment)!
  const charCount = message.length
  const estimatedMessages = Math.ceil(charCount / 160)

  const applyTemplate = (t: MessageTemplate) => {
    setMessage(t.body)
    setSelectedTemplate(t.id)
    setShowTemplates(false)
  }

  const handleSend = () => {
    setSending(true)
    setTimeout(() => {
      setSending(false)
      setSent(true)
      setTimeout(() => setSent(false), 4000)
    }, 2000)
  }

  const canSend = message.trim().length > 10 && !sending && !sent

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Broadcast</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Send WhatsApp messages to customer segments</p>
        </div>
        <button
          onClick={() => setShowHistory(v => !v)}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors flex-shrink-0"
        >
          <Clock className="h-3.5 w-3.5" />
          History
        </button>
      </div>

      {/* Sent confirmation */}
      <AnimatePresence>
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-brand-green/10 border border-brand-green/30"
          >
            <CheckCheck className="h-5 w-5 text-brand-green flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-brand-green">Broadcast sent!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Queued for {segment.count.toLocaleString()} {segment.label.toLowerCase()} customers via WhatsApp.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Compose */}
        <div className="lg:col-span-2 space-y-4">

          {/* Segment selector */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Send to</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SEGMENTS.map(seg => (
                <button
                  key={seg.id}
                  onClick={() => setSelectedSegment(seg.id)}
                  className={cn(
                    "flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all",
                    selectedSegment === seg.id
                      ? "border-brand-purple/40 bg-brand-purple/5"
                      : "border-border hover:border-brand-purple/20 hover:bg-accent/50"
                  )}
                >
                  <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg flex-shrink-0 mt-0.5", seg.bg)}>
                    <Users className={cn("h-3.5 w-3.5", seg.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{seg.label}</p>
                    <p className={cn("text-[10px] font-bold", seg.color)}>{seg.count.toLocaleString()}</p>
                  </div>
                  {selectedSegment === seg.id && (
                    <div className="ml-auto flex-shrink-0 w-4 h-4 rounded-full bg-brand-purple flex items-center justify-center">
                      <CheckCheck className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">{segment.description}</p>
          </div>

          {/* Message composer */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</p>
              <button
                onClick={() => setShowTemplates(v => !v)}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border text-xs font-semibold hover:bg-accent transition-colors"
              >
                <Sparkles className="h-3 w-3 text-brand-purple" />
                Templates
                {showTemplates ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {/* Templates */}
            <AnimatePresence>
              {showTemplates && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => applyTemplate(t)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all",
                          selectedTemplate === t.id
                            ? "border-brand-purple/40 bg-brand-purple/5"
                            : "border-border hover:border-brand-purple/20 hover:bg-accent/50"
                        )}
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-purple/10 flex-shrink-0">
                          <t.icon className="h-3.5 w-3.5 text-brand-purple" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{t.label}</p>
                          <p className="text-[10px] text-muted-foreground">{t.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Textarea */}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your message here, or pick a template above…

Use {firstName} to personalise each message.
Use {storeName} and {storeUrl} as shortcuts."
              rows={8}
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30 leading-relaxed"
            />

            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{charCount} chars</span>
                {charCount > 0 && <span>~{estimatedMessages} SMS segment{estimatedMessages > 1 ? "s" : ""}</span>}
              </div>
              <button
                onClick={() => setShowPreview(v => !v)}
                className="flex items-center gap-1 text-xs text-brand-purple font-semibold hover:underline"
              >
                <Eye className="h-3 w-3" />
                {showPreview ? "Hide" : "Preview"}
              </button>
            </div>

            {/* WhatsApp disclaimer */}
            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>WhatsApp Policy:</strong> Broadcast messages can only be sent to customers who have messaged your store before. Spam will result in your number being blocked.
              </p>
            </div>
          </div>

          {/* Send button */}
          <div className="flex items-center gap-3">
            <Button
              className="flex-1 gap-2 h-11"
              onClick={handleSend}
              disabled={!canSend}
            >
              {sending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Sending to {segment.count.toLocaleString()} contacts…
                </>
              ) : sent ? (
                <><CheckCheck className="h-4 w-4" />Sent!</>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 fill-white/50" />
                  Send to {segment.count.toLocaleString()} {segment.label.toLowerCase()}
                </>
              )}
            </Button>
            {message && (
              <button
                onClick={() => { setMessage(""); setSelectedTemplate(null) }}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border hover:bg-accent transition-colors"
              >
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Preview + tips */}
        <div className="space-y-4">

          {/* WhatsApp preview */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">WhatsApp preview</p>
            <div className="rounded-2xl bg-[#e5ddd5] dark:bg-[#1a1a2e] p-4 min-h-32">
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-[#dcf8c6] dark:bg-[#1f5c35] rounded-2xl rounded-tr-sm px-3.5 py-2.5 shadow-sm">
                  {message ? (
                    <p className="text-xs text-[#111] dark:text-[#e0e0e0] leading-relaxed whitespace-pre-wrap">
                      {previewMessage(message)}
                    </p>
                  ) : (
                    <p className="text-xs text-[#999] italic">Your message will appear here…</p>
                  )}
                  <p className="text-[9px] text-[#999] mt-1 text-right">12:00 PM ✓✓</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Variables replaced with real customer data at send time
            </p>
          </div>

          {/* Send summary */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-4 space-y-2.5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Send summary</p>
              {[
                { label: "Recipients",   value: segment.count.toLocaleString() },
                { label: "Segment",      value: segment.label },
                { label: "Channel",      value: "WhatsApp" },
                { label: "Est. delivery", value: "~2 minutes" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-semibold">{row.value}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Best practice tips */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Best practices</p>
            <ul className="space-y-2.5">
              {[
                "Personalise with {firstName} — open rates jump 40%",
                "Keep it under 300 characters for best read-through",
                "Send between 9am–6pm for maximum engagement",
                "Include a clear call-to-action (DM, link, reply)",
                "Max 1–2 broadcasts per week to avoid spam reports",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple font-bold text-[9px] flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-display font-bold text-base">Broadcast history</h2>
              </div>
              <div className="hidden sm:grid grid-cols-[1fr_120px_80px_100px_100px] gap-4 px-5 py-2.5 bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                <span>Message</span><span>Segment</span><span>Sent to</span><span>Delivered</span><span>Read</span>
              </div>
              <div className="divide-y divide-border">
                {HISTORY.map((record, i) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_100px_100px] gap-2 sm:gap-4 px-5 py-4 hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-medium line-clamp-1">{record.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{record.sentAt}</p>
                    </div>
                    <p className="text-xs text-muted-foreground hidden sm:block self-center">{record.segment}</p>
                    <p className="text-sm font-semibold hidden sm:block self-center">{record.recipients.toLocaleString()}</p>
                    <div className="hidden sm:block self-center">
                      <p className="text-xs font-semibold text-brand-green">{record.delivered.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{Math.round(record.delivered/record.recipients*100)}%</p>
                    </div>
                    <div className="hidden sm:block self-center">
                      <p className="text-xs font-semibold text-brand-purple">{record.read.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{Math.round(record.read/record.recipients*100)}%</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
