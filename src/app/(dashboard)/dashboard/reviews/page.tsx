"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, MessageSquare, TrendingUp, ThumbsUp, Search, ChevronDown, MessageCircle, CheckCheck, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const STORE_WA = "+234 803 456 7890"
const STORE_NAME = "Sade's Boutique"

const mockReviews = [
  { id: "R1", customer: "Amaka O.", phone: "+234 803 111 2222", product: "Ankara Peplum Top",  rating: 5, comment: "Absolutely love this! The fabric quality is amazing and it fits perfectly. Will definitely order again.", date: "May 3, 2026",  verified: true, helpful: 12 },
  { id: "R2", customer: "Chidi N.",  phone: "+234 806 222 3333", product: "Men's Agbada Set",   rating: 5, comment: "Very professional packaging and the material is top notch. Got so many compliments at the event!",  date: "Apr 29, 2026", verified: true, helpful: 8  },
  { id: "R3", customer: "Funmi A.",  phone: "+234 810 333 4444", product: "Lace Iro & Buba",    rating: 4, comment: "Beautiful design, delivery was a bit slow but the quality made up for it. Highly recommended.",   date: "Apr 22, 2026", verified: true, helpful: 5  },
  { id: "R4", customer: "Tunde B.",  phone: "+234 817 444 5555", product: "Dashiki Shirt",       rating: 5, comment: "Perfect fit and the colors are vibrant. Customer service was excellent when I had a size question.", date: "Apr 18, 2026", verified: true, helpful: 7  },
  { id: "R5", customer: "Ngozi M.",  phone: "+234 808 555 6666", product: "Adire Gown",          rating: 3, comment: "Nice fabric but the stitching on one side wasn't clean. Seller resolved it quickly though.",      date: "Apr 10, 2026", verified: true, helpful: 2  },
  { id: "R6", customer: "Emeka I.",  phone: "+234 816 666 7777", product: "Aso-Oke Fila",        rating: 5, comment: "Excellent quality! This is my third order from this store. Never disappointed.",                date: "Apr 5, 2026",  verified: true, helpful: 14 },
]

const ratingDist = [
  { stars: 5, count: 4, pct: 67 },
  { stars: 4, count: 1, pct: 17 },
  { stars: 3, count: 1, pct: 16 },
  { stars: 2, count: 0, pct: 0  },
  { stars: 1, count: 0, pct: 0  },
]

const DEFAULT_REPLIES: Record<number, string> = {
  5: "Thank you so much {firstName}! 💜 Your kind words mean the world to us. We're so happy you love your {product}! Can't wait to serve you again 🛍️",
  4: "Thank you for your feedback {firstName}! 😊 So glad you enjoyed your {product}. We're always working to improve — your review helps us a lot! 💜",
  3: "Thank you for your honest feedback {firstName}. We're sorry your experience wasn't perfect, but we're glad we could resolve it. Your satisfaction is our top priority 💜",
}

function buildReply(rating: number, customer: string, product: string): string {
  const firstName = customer.split(" ")[0]
  const template = DEFAULT_REPLIES[rating] ?? DEFAULT_REPLIES[3]
  return template.replace("{firstName}", firstName).replace("{product}", product)
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3 w-3"
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={cn(cls, n <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20")} />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: typeof mockReviews[0] }) {
  const [replyOpen, setReplyOpen] = React.useState(false)
  const [replyText, setReplyText] = React.useState(() => buildReply(review.rating, review.customer, review.product))
  const [sent, setSent] = React.useState(false)

  const waUrl = `https://wa.me/${review.phone.replace(/\D/g, "")}?text=${encodeURIComponent(replyText)}`

  const handleSend = () => {
    setSent(true)
    toast({ title: "Reply sent via WhatsApp!", description: `Message sent to ${review.customer}.`, variant: "success" })
    setTimeout(() => { setSent(false); setReplyOpen(false) }, 2000)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center text-xs font-bold text-brand-purple flex-shrink-0">
            {review.customer.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold">{review.customer}</p>
              {review.verified && <span className="text-[9px] bg-brand-green/10 text-brand-green px-1.5 py-0.5 rounded-full font-semibold">Verified</span>}
            </div>
            <p className="text-[10px] text-muted-foreground">{review.date}</p>
          </div>
        </div>
        <StarRow rating={review.rating} />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3">&ldquo;{review.comment}&rdquo;</p>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-[10px] text-brand-purple/70 font-medium">Product: {review.product}</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <ThumbsUp className="h-3 w-3" /> {review.helpful} helpful
          </div>
          <button onClick={() => setReplyOpen(v => !v)}
            className={cn(
              "flex items-center gap-1 text-[11px] font-semibold transition-colors",
              replyOpen ? "text-brand-purple" : "text-muted-foreground hover:text-brand-purple"
            )}>
            <MessageCircle className="h-3 w-3" />
            {sent ? "Sent!" : replyOpen ? "Hide reply" : "Reply"}
          </button>
        </div>
      </div>

      {/* Reply composer */}
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

export default function ReviewsPage() {
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState("All")

  const avgRating = (mockReviews.reduce((s, r) => s + r.rating, 0) / mockReviews.length).toFixed(1)

  const filtered = mockReviews.filter(r => {
    const matchSearch = !search || r.customer.toLowerCase().includes(search.toLowerCase()) || r.product.toLowerCase().includes(search.toLowerCase()) || r.comment.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "All" || r.rating === Number(filter)
    return matchSearch && matchFilter
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold">Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">Customer feedback and product ratings</p>
      </div>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center justify-center sm:border-r border-border sm:pr-6 sm:min-w-[140px]">
            <p className="font-display text-5xl font-extrabold text-amber-400">{avgRating}</p>
            <StarRow rating={Math.round(Number(avgRating))} size="md" />
            <p className="text-xs text-muted-foreground mt-1">{mockReviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-2">
            {ratingDist.map(d => (
              <div key={d.stars} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-3 text-right">{d.stars}</span>
                <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-5">{d.count}</span>
              </div>
            ))}
          </div>
          <div className="flex sm:flex-col gap-4 sm:gap-3 sm:border-l border-border sm:pl-6 sm:min-w-[140px] sm:justify-center">
            {[
              { label: "Satisfied",      value: "94%",  icon: ThumbsUp,    color: "text-brand-green"  },
              { label: "Response rate",  value: "100%", icon: MessageSquare, color: "text-brand-purple" },
              { label: "Trending",       value: "+12%", icon: TrendingUp,  color: "text-brand-coral"  },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-2">
                <m.icon className={cn("h-4 w-4", m.color)} />
                <div>
                  <p className="text-sm font-bold">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews…"
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
        </div>
        <div className="relative">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30 appearance-none cursor-pointer">
            <option value="All">All ratings</option>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} stars</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No reviews found</p>
          </div>
        ) : filtered.map((review, i) => (
          <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
            <ReviewCard review={review} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
