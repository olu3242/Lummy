"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Star, MessageSquare, TrendingUp, ThumbsUp, Search,
  ChevronDown, MessageCircle, CheckCheck, RotateCcw,
  Send, Users, Sparkles, X, Filter, BarChart3,
  ArrowUpRight, Bell, Package, Download, Pin,
  Tag, Copy, Hash, TrendingDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface Review {
  id: string; customer: string; phone: string; product: string
  rating: number; comment: string; date: string; verified: boolean
  helpful: number; replied: boolean; month: string; pinned?: boolean
}

const mockReviews: Review[] = [
  { id: "R1", customer: "Amaka O.",    phone: "+234 803 111 2222", product: "Ankara Peplum Top",       rating: 5, comment: "Absolutely love this! The fabric quality is amazing and it fits perfectly. Will definitely order again.",           date: "May 3, 2026",  verified: true,  helpful: 12, replied: true,  month: "May", pinned: true  },
  { id: "R2", customer: "Chidi N.",    phone: "+234 806 222 3333", product: "Men's Agbada Set",         rating: 5, comment: "Very professional packaging and the material is top notch. Got so many compliments at the event!",             date: "Apr 29, 2026", verified: true,  helpful: 8,  replied: true,  month: "Apr"  },
  { id: "R3", customer: "Funmi A.",    phone: "+234 810 333 4444", product: "Lace Iro & Buba",          rating: 4, comment: "Beautiful design, delivery was a bit slow but the quality made up for it. Highly recommended.",               date: "Apr 22, 2026", verified: true,  helpful: 5,  replied: false, month: "Apr"  },
  { id: "R4", customer: "Tunde B.",    phone: "+234 817 444 5555", product: "Dashiki Shirt",             rating: 5, comment: "Perfect fit and the colors are vibrant. Customer service was excellent when I had a size question.",          date: "Apr 18, 2026", verified: true,  helpful: 7,  replied: true,  month: "Apr"  },
  { id: "R5", customer: "Ngozi M.",    phone: "+234 808 555 6666", product: "Adire Gown",                rating: 3, comment: "Nice fabric but the stitching on one side wasn't clean. Seller resolved it quickly though.",                date: "Apr 10, 2026", verified: true,  helpful: 2,  replied: false, month: "Apr"  },
  { id: "R6", customer: "Emeka I.",    phone: "+234 816 666 7777", product: "Aso-Oke Fila",              rating: 5, comment: "Excellent quality! This is my third order from this store. Never disappointed.",                           date: "Apr 5, 2026",  verified: true,  helpful: 14, replied: true,  month: "Apr"  },
  { id: "R7", customer: "Blessing E.", phone: "+234 814 234 5678", product: "Perfume Collection Box",    rating: 5, comment: "The scents are absolutely divine! Very rich packaging. Perfect as a gift.",                                  date: "Mar 28, 2026", verified: true,  helpful: 9,  replied: true,  month: "Mar"  },
  { id: "R8", customer: "Folake A.",   phone: "+234 705 123 4567", product: "Beaded Necklace Set",       rating: 4, comment: "Beautiful pieces, very unique. The photos matched exactly what arrived. Shipping took a week though.",       date: "Mar 15, 2026", verified: true,  helpful: 6,  replied: false, month: "Mar"  },
]

const MONTHLY_RATINGS = [
  { month: "Jan", avg: 4.6, count: 8  },
  { month: "Feb", avg: 4.4, count: 11 },
  { month: "Mar", avg: 4.7, count: 14 },
  { month: "Apr", avg: 4.5, count: 19 },
  { month: "May", avg: 5.0, count: 6  },
]

const PER_PRODUCT_RATINGS = [
  { product: "Ankara Peplum Top",    avg: 4.9, count: 14 },
  { product: "Men's Agbada Set",     avg: 4.8, count: 9  },
  { product: "Lace Iro & Buba",      avg: 4.2, count: 7  },
  { product: "Dashiki Shirt",        avg: 4.6, count: 11 },
  { product: "Adire Gown",           avg: 3.8, count: 5  },
]

const TOP_MENTIONS = [
  { word: "quality",    count: 18, sentiment: "positive" },
  { word: "fabric",     count: 15, sentiment: "positive" },
  { word: "fit",        count: 12, sentiment: "positive" },
  { word: "delivery",   count: 9,  sentiment: "negative" },
  { word: "packaging",  count: 8,  sentiment: "positive" },
  { word: "colour",     count: 7,  sentiment: "positive" },
]

const PRODUCTS = ["All Products", ...Array.from(new Set(mockReviews.map(r => r.product)))]

const UNREVIEWED_CUSTOMERS = [
  { name: "Kemi Adeyemi",     phone: "+234 806 123 4567", product: "Beaded Necklace Set", deliveredDays: 5  },
  { name: "Chisom Nwachukwu", phone: "+234 802 345 6789", product: "Silk Blouse",          deliveredDays: 14 },
  { name: "Tolani Bakare",    phone: "+234 817 890 1234", product: "Embroidered Set",       deliveredDays: 7  },
  { name: "Amaka Eze",        phone: "+234 903 456 7890", product: "Beaded Bracelet",       deliveredDays: 3  },
]

const DEFAULT_REPLIES: Record<number, string> = {
  5: "Thank you so much {firstName}! 💜 Your kind words mean the world to us. We're so happy you love your {product}! Can't wait to serve you again 🛍️",
  4: "Thank you for your feedback {firstName}! 😊 So glad you enjoyed your {product}. We're always working to improve — your review helps us a lot! 💜",
  3: "Thank you for your honest feedback {firstName}. We're sorry your experience wasn't perfect, but we're glad we could resolve it. Your satisfaction is our top priority 💜",
}

const REVIEW_REQUEST_TEMPLATE = (firstName: string, product: string) =>
  `Hi ${firstName}! 👋 Thanks for ordering ${product} from us. We'd love to know how you're enjoying it! Could you leave us a quick review? Your feedback helps us serve you better 💜 It takes less than 30 seconds!`

function buildReply(rating: number, customer: string, product: string) {
  const firstName = customer.split(" ")[0]
  return (DEFAULT_REPLIES[rating] ?? DEFAULT_REPLIES[3])
    .replace("{firstName}", firstName)
    .replace("{product}", product)
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3 w-3"
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={cn(cls, n <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20")} />
      ))}
    </div>
  )
}

function RatingTrendChart() {
  const max = 5
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rating Trend</p>
      <div className="flex items-end gap-2 h-16">
        {MONTHLY_RATINGS.map((m, i) => {
          const pct = (m.avg / max) * 100
          return (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[9px] font-bold text-brand-purple">{m.avg}</span>
              <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                transition={{ delay: i * 0.08, type: "spring", damping: 20 }}
                className="w-full rounded-t-md bg-amber-400/80 hover:bg-amber-400 transition-colors"
                style={{ minHeight: 4 }} />
            </div>
          )
        })}
      </div>
      <div className="flex gap-2">
        {MONTHLY_RATINGS.map(m => (
          <p key={m.month} className="flex-1 text-center text-[9px] text-muted-foreground">{m.month}</p>
        ))}
      </div>
    </div>
  )
}

/** Sentiment donut using inline SVG */
function SentimentDonut({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const total  = positive + neutral + negative
  const r = 28; const circ = 2 * Math.PI * r
  const segments = [
    { pct: positive / total, color: "#10B981", label: "Positive" },
    { pct: neutral  / total, color: "#F59E0B", label: "Neutral"  },
    { pct: negative / total, color: "#F97316", label: "Negative" },
  ]
  let offset = 0
  return (
    <div className="flex items-center gap-4">
      <svg width={72} height={72} className="-rotate-90">
        <circle cx={36} cy={36} r={r} fill="none" strokeWidth={10} className="stroke-muted" />
        {segments.map((s, i) => {
          const dash = s.pct * circ
          const seg = (
            <motion.circle key={i} cx={36} cy={36} r={r} fill="none" strokeWidth={10}
              stroke={s.color} strokeLinecap="butt"
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={-offset}
              initial={{ strokeDasharray: `0 ${circ}` }}
              animate={{ strokeDasharray: `${dash} ${circ}` }}
              transition={{ duration: 0.8, delay: i * 0.1 }} />
          )
          offset += dash
          return seg
        })}
      </svg>
      <div className="space-y-1.5">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-bold ml-auto">{Math.round(s.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewCard({ review, onMarkReplied, onTogglePin }: {
  review: Review
  onMarkReplied: (id: string) => void
  onTogglePin: (id: string) => void
}) {
  const [replyOpen, setReplyOpen] = React.useState(false)
  const [replyText, setReplyText] = React.useState(() => buildReply(review.rating, review.customer, review.product))
  const [sent,      setSent]      = React.useState(review.replied)
  const [saveAsTemplate, setSaveAsTemplate] = React.useState(false)
  const waUrl = `https://wa.me/${review.phone.replace(/\D/g, "")}?text=${encodeURIComponent(replyText)}`

  const handleSend = () => {
    setSent(true)
    onMarkReplied(review.id)
    if (saveAsTemplate) toast({ title: "Reply saved as template!", variant: "success" })
    else toast({ title: "Reply sent via WhatsApp!", description: `Message sent to ${review.customer}.`, variant: "success" })
    setTimeout(() => setReplyOpen(false), 1500)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl border bg-card p-4 transition-colors",
        review.pinned ? "border-brand-purple/20 bg-brand-purple/5" :
        !review.replied && !sent ? "border-amber-500/20" : "border-border")}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center text-xs font-bold text-brand-purple flex-shrink-0">
            {review.customer.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs font-semibold">{review.customer}</p>
              {review.verified && <span className="text-[9px] bg-brand-green/10 text-brand-green px-1.5 py-0.5 rounded-full font-semibold">Verified</span>}
              {review.pinned && <span className="text-[9px] bg-brand-purple/10 text-brand-purple px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5"><Pin className="h-2.5 w-2.5" />Pinned</span>}
              {!review.replied && !sent && (
                <span className="text-[9px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold border border-amber-500/20">Needs reply</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">{review.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StarRow rating={review.rating} />
          <button onClick={() => onTogglePin(review.id)}
            className={cn("p-1 rounded-lg transition-colors", review.pinned ? "text-brand-purple bg-brand-purple/10" : "text-muted-foreground hover:bg-muted")}>
            <Pin className="h-3 w-3" />
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3">&ldquo;{review.comment}&rdquo;</p>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-[10px] text-brand-purple/70 font-medium truncate flex items-center gap-1">
          <Package className="h-3 w-3 flex-shrink-0" />{review.product}
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <ThumbsUp className="h-3 w-3" /> {review.helpful}
          </div>
          {sent || review.replied ? (
            <span className="flex items-center gap-1 text-[11px] text-brand-green font-semibold">
              <CheckCheck className="h-3 w-3" /> Replied
            </span>
          ) : (
            <button onClick={() => setReplyOpen(v => !v)}
              className={cn("flex items-center gap-1 text-[11px] font-semibold transition-colors",
                replyOpen ? "text-brand-purple" : "text-muted-foreground hover:text-brand-purple")}>
              <MessageCircle className="h-3 w-3" />
              {replyOpen ? "Hide" : "Reply"}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {replyOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp reply</p>
                <button onClick={() => setReplyText(buildReply(review.rating, review.customer, review.product))}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-purple/30 leading-relaxed" />
              {/* Save as template toggle */}
              <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={saveAsTemplate} onChange={e => setSaveAsTemplate(e.target.checked)}
                  className="w-3 h-3 rounded accent-brand-purple" />
                Save as reply template
              </label>
              <div className="flex gap-2">
                <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={handleSend} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl bg-[#25D366] hover:bg-[#20b958] text-white text-xs font-semibold transition-colors">
                    {sent
                      ? <><CheckCheck className="h-3.5 w-3.5" />Sent!</>
                      : <><MessageCircle className="h-3.5 w-3.5 fill-white" />Send via WhatsApp</>}
                  </button>
                </a>
                <button onClick={() => setReplyOpen(false)}
                  className="h-8 px-3 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function RequestReviewModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [customMsg, setCustomMsg] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [done, setDone] = React.useState(false)

  const toggleSelect = (name: string) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(name) ? s.delete(name) : s.add(name)
      return s
    })
  }

  const handleSend = () => {
    if (selected.size === 0) { toast({ title: "Select at least one customer" }); return }
    setSending(true)
    setTimeout(() => {
      setSending(false); setDone(true)
      toast({ title: `Review requests sent to ${selected.size} customer${selected.size > 1 ? "s" : ""}`, variant: "success" })
      setTimeout(onClose, 1500)
    }, 1500)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-border bg-card overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-purple/10 flex items-center justify-center">
              <Bell className="h-4 w-4 text-brand-purple" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm">Request Reviews</h2>
              <p className="text-[10px] text-muted-foreground">Send review requests via WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {done ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto">
                <CheckCheck className="h-7 w-7 text-brand-green" />
              </div>
              <p className="text-sm font-bold">Requests sent!</p>
              <p className="text-xs text-muted-foreground">{selected.size} customers will receive a WhatsApp review request.</p>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customers without reviews ({UNREVIEWED_CUSTOMERS.length})</p>
                  <div className="flex gap-2">
                    <button onClick={() => setSelected(new Set(UNREVIEWED_CUSTOMERS.map(c => c.name)))} className="text-[10px] text-brand-purple hover:underline font-semibold">All</button>
                    <button onClick={() => setSelected(new Set())} className="text-[10px] text-muted-foreground hover:underline">None</button>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {UNREVIEWED_CUSTOMERS.map(c => (
                    <label key={c.name}
                      className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        selected.has(c.name) ? "border-brand-purple/30 bg-brand-purple/5" : "border-border hover:border-foreground/10")}>
                      <input type="checkbox" checked={selected.has(c.name)} onChange={() => toggleSelect(c.name)}
                        className="w-3.5 h-3.5 rounded accent-brand-purple flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{c.product} · delivered {c.deliveredDays}d ago</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message preview</p>
                  <span className="text-[10px] text-brand-purple flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI-generated</span>
                </div>
                <textarea value={customMsg || REVIEW_REQUEST_TEMPLATE("them", "their order")} onChange={e => setCustomMsg(e.target.value)}
                  rows={4} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 leading-relaxed" />
                <p className="text-[10px] text-muted-foreground mt-1">{`{firstName}`} and {`{product}`} will be replaced per customer.</p>
              </div>
              <Button onClick={handleSend} disabled={sending || selected.size === 0} variant="whatsapp" className="w-full gap-2 h-10">
                {sending ? <><span className="animate-spin">⏳</span> Sending…</> : <><Send className="h-3.5 w-3.5" /> Send to {selected.size || 0} customer{selected.size !== 1 ? "s" : ""}</>}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function IncentiveModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = React.useState("")
  const [pct,  setPct]  = React.useState("10")
  const [copied, setCopied] = React.useState(false)

  const generate = () => {
    const c = `REVIEW${Math.floor(10 + Math.random() * 90)}`
    setCode(c)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Discount code copied!", variant: "success" })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xs rounded-3xl border border-border bg-card overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-bold text-sm flex items-center gap-2">
            <Tag className="h-4 w-4 text-brand-purple" /> Reward a Reviewer
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">Generate a discount code to thank a customer for their review.</p>
          <div>
            <label className="text-xs font-semibold block mb-1.5">Discount %</label>
            <div className="flex gap-2">
              {["5", "10", "15", "20"].map(v => (
                <button key={v} onClick={() => setPct(v)}
                  className={cn("flex-1 h-8 rounded-xl border text-xs font-semibold transition-all",
                    pct === v ? "border-brand-purple/30 bg-brand-purple/10 text-brand-purple" : "border-border hover:bg-muted text-muted-foreground")}>
                  {v}%
                </button>
              ))}
            </div>
          </div>
          <Button onClick={generate} variant="outline" className="w-full gap-2">
            <Hash className="h-3.5 w-3.5" /> Generate Code
          </Button>
          {code && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 rounded-xl bg-brand-purple/5 border border-brand-purple/20">
              <div>
                <p className="text-[9px] text-muted-foreground">Discount code ({pct}% off)</p>
                <p className="text-base font-mono font-bold text-brand-purple">{code}</p>
              </div>
              <button onClick={copyCode} className="p-2 rounded-xl hover:bg-brand-purple/10 transition-colors">
                {copied ? <CheckCheck className="h-4 w-4 text-brand-green" /> : <Copy className="h-4 w-4 text-brand-purple" />}
              </button>
            </motion.div>
          )}
          <Button className="w-full" onClick={onClose}>Done</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function exportReviewsCSV(reviews: Review[]) {
  const header = "Customer,Product,Rating,Comment,Date,Replied"
  const rows = reviews.map(r =>
    `"${r.customer}","${r.product}",${r.rating},"${r.comment.replace(/"/g, "''")}","${r.date}",${r.replied}`
  )
  const csv = [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url; a.download = "reviews.csv"; a.click()
  URL.revokeObjectURL(url)
  toast({ title: "Reviews exported!", variant: "success" })
}

export default function ReviewsPage() {
  const [reviews, setReviews] = React.useState<Review[]>(mockReviews)
  const [search,       setSearch]       = React.useState("")
  const [ratingFilter, setRatingFilter] = React.useState("All")
  const [productFilter,setProductFilter]= React.useState("All Products")
  const [showUnreplied,setShowUnreplied]= React.useState(false)
  const [requestModalOpen, setRequestModalOpen] = React.useState(false)
  const [incentiveOpen,    setIncentiveOpen]    = React.useState(false)
  const [activePanel, setActivePanel] = React.useState<"insights" | null>(null)

  const avgRating     = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
  const repliedCount  = reviews.filter(r => r.replied).length
  const unrepliedCount= reviews.filter(r => !r.replied).length
  const pinnedCount   = reviews.filter(r => r.pinned).length

  const ratingDist = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length
    return { stars, count, pct: Math.round((count / reviews.length) * 100) }
  })

  const positive = reviews.filter(r => r.rating >= 4).length
  const neutral  = reviews.filter(r => r.rating === 3).length
  const negative = reviews.filter(r => r.rating <= 2).length

  const thisMonthCount = reviews.filter(r => r.month === "May").length
  const lastMonthCount = reviews.filter(r => r.month === "Apr").length
  const monthPace = Math.round((thisMonthCount / 12) * 31) // projected full month

  const filtered = reviews.filter(r => {
    const matchSearch = !search || r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.product.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase())
    const matchRating  = ratingFilter === "All" || r.rating === Number(ratingFilter)
    const matchProduct = productFilter === "All Products" || r.product === productFilter
    const matchUnreplied = !showUnreplied || !r.replied
    return matchSearch && matchRating && matchProduct && matchUnreplied
  }).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  const markReplied  = (id: string) => setReviews(prev => prev.map(r => r.id === id ? { ...r, replied: true } : r))
  const togglePin    = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, pinned: !r.pinned } : r))
    const r = reviews.find(r => r.id === id)
    toast({ title: r?.pinned ? "Review unpinned" : "Review pinned to top", variant: "success" })
  }

  return (
    <>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Reviews</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Customer feedback and product ratings</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="gap-1.5 h-9 text-xs" onClick={() => exportReviewsCSV(reviews)}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-9 text-xs" onClick={() => setIncentiveOpen(true)}>
              <Tag className="h-3.5 w-3.5" /> Reward
            </Button>
            <Button size="sm" onClick={() => setRequestModalOpen(true)} variant="whatsapp" className="gap-1.5 h-9 text-xs">
              <Send className="h-3.5 w-3.5" /> Request Reviews
            </Button>
          </div>
        </div>

        {/* Unreplied nudge */}
        {unrepliedCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">{unrepliedCount} review{unrepliedCount > 1 ? "s" : ""} awaiting your reply</p>
                <p className="text-xs text-muted-foreground mt-0.5">Replying builds trust and boosts your store&apos;s visibility.</p>
              </div>
            </div>
            <button onClick={() => setShowUnreplied(true)} className="flex-shrink-0 text-xs font-semibold text-amber-600 hover:underline whitespace-nowrap">
              View {unrepliedCount} →
            </button>
          </motion.div>
        )}

        {/* Summary card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Score */}
            <div className="flex flex-col items-center justify-center sm:border-r border-border sm:pr-5 sm:min-w-[130px]">
              <p className="font-display text-5xl font-extrabold text-amber-400">{avgRating}</p>
              <StarRow rating={Math.round(Number(avgRating))} size="md" />
              <p className="text-xs text-muted-foreground mt-1">{reviews.length} reviews</p>
            </div>

            {/* Rating bars */}
            <div className="flex-1 space-y-2">
              {ratingDist.map(d => (
                <div key={d.stars} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-3 text-right">{d.stars}</span>
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${d.pct}%` }}
                      transition={{ delay: 0.2, type: "spring", damping: 20 }}
                      className="h-full bg-amber-400 rounded-full" />
                  </div>
                  <span className="text-xs text-muted-foreground w-5">{d.count}</span>
                </div>
              ))}
            </div>

            {/* Stats + trend */}
            <div className="sm:border-l border-border sm:pl-5 sm:min-w-[200px] space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Satisfied",  value: `${Math.round((positive / reviews.length) * 100)}%`, icon: ThumbsUp,     color: "text-brand-green"  },
                  { label: "Response",   value: `${repliedCount}/${reviews.length}`,                  icon: MessageSquare, color: "text-brand-purple" },
                  { label: "Trend",      value: thisMonthCount >= lastMonthCount ? "+12%" : "-5%",    icon: thisMonthCount >= lastMonthCount ? TrendingUp : TrendingDown, color: "text-brand-coral" },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <m.icon className={cn("h-4 w-4 mx-auto mb-1", m.color)} />
                    <p className="text-sm font-bold">{m.value}</p>
                    <p className="text-[9px] text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
              <RatingTrendChart />
            </div>
          </div>
        </motion.div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Avg Rating",    value: avgRating,                                   icon: Star,         color: "text-amber-500",    sub: "All time"     },
            { label: "Total Reviews", value: reviews.length.toString(),                    icon: MessageSquare,color: "text-brand-purple", sub: `${reviews.length} total` },
            { label: "Replied",       value: `${repliedCount}`,                            icon: CheckCheck,   color: "text-brand-green",  sub: "Responded to" },
            { label: "May pace",      value: `~${monthPace}`,                              icon: TrendingUp,   color: "text-brand-coral",  sub: "Projected month" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{stat.label}</p>
                <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
              </div>
              <p className="font-display text-xl font-extrabold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Insights panel toggle */}
        <button onClick={() => setActivePanel(p => p === "insights" ? null : "insights")}
          className={cn("w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all text-sm font-bold",
            activePanel === "insights" ? "border-brand-purple/30 bg-brand-purple/5" : "border-border bg-card hover:bg-muted/30")}>
          <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-brand-purple" /> Review Insights</span>
          {activePanel === "insights" ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />}
        </button>

        <AnimatePresence>
          {activePanel === "insights" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-1">
                {/* Sentiment donut */}
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sentiment</p>
                  <SentimentDonut positive={positive} neutral={neutral} negative={negative} />
                </div>

                {/* Top mentions */}
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Top Mentions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TOP_MENTIONS.map(m => (
                      <span key={m.word}
                        className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                          m.sentiment === "positive"
                            ? "bg-brand-green/10 text-brand-green border-brand-green/20"
                            : "bg-brand-coral/10 text-brand-coral border-brand-coral/20")}>
                        {m.word} ({m.count})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Per-product avg ratings */}
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">By Product</p>
                  <div className="space-y-2">
                    {PER_PRODUCT_RATINGS.map(p => (
                      <div key={p.product} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground truncate flex-1">{p.product.split(" ").slice(0, 2).join(" ")}</span>
                          <span className="font-bold ml-2">{p.avg} ★</span>
                        </div>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <motion.div className="h-full bg-amber-400 rounded-full"
                            initial={{ width: 0 }} animate={{ width: `${(p.avg / 5) * 100}%` }}
                            transition={{ duration: 0.6 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews…"
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>
          <div className="relative">
            <select value={productFilter} onChange={e => setProductFilter(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/30 appearance-none cursor-pointer">
              {PRODUCTS.map(p => <option key={p} value={p}>{p.length > 20 ? p.slice(0, 18) + "…" : p}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/30 appearance-none cursor-pointer">
              <option value="All">All stars</option>
              {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ★</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <button onClick={() => setShowUnreplied(v => !v)}
            className={cn("flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold transition-all",
              showUnreplied ? "border-amber-500/40 bg-amber-500/10 text-amber-600" : "border-border text-muted-foreground hover:border-foreground/20")}>
            <Filter className="h-3.5 w-3.5" />
            {showUnreplied ? "Unreplied only" : "All replies"}
          </button>
          {pinnedCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-2.5 py-1 rounded-full">
              <Pin className="h-3 w-3" /> {pinnedCount} pinned
            </span>
          )}
        </div>

        {/* Reviews list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground rounded-2xl border border-border bg-card">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No reviews found</p>
              <p className="text-xs mt-1">Try a different filter or search term</p>
            </div>
          ) : filtered.map((review, i) => (
            <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <ReviewCard review={review} onMarkReplied={markReplied} onTogglePin={togglePin} />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 p-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#25D366]/15 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-[#25D366]" />
            </div>
            <div>
              <p className="text-sm font-semibold">Get more reviews automatically</p>
              <p className="text-xs text-muted-foreground mt-0.5">{UNREVIEWED_CUSTOMERS.length} recent customers haven&apos;t left a review yet.</p>
            </div>
          </div>
          <Button size="sm" variant="whatsapp" className="gap-1.5 text-xs h-8 flex-shrink-0" onClick={() => setRequestModalOpen(true)}>
            <ArrowUpRight className="h-3.5 w-3.5" /> Request
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {requestModalOpen && <RequestReviewModal key="request" onClose={() => setRequestModalOpen(false)} />}
        {incentiveOpen    && <IncentiveModal     key="incentive" onClose={() => setIncentiveOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
