"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Megaphone, MessageCircle, Instagram, Music2, TrendingUp,
  Users, BarChart3, Eye, Target, X, Check, ChevronRight,
  Calendar, Zap, Sparkles, Loader2, ExternalLink,
  ToggleLeft, ToggleRight, Copy, CheckCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignStatus = "active" | "draft" | "ended" | "scheduled"
type CampaignChannel = "whatsapp" | "instagram" | "tiktok"
type CampaignGoal = "sales" | "awareness" | "restock" | "reengagement"

interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  goal: CampaignGoal
  channels: CampaignChannel[]
  startDate: string
  endDate?: string
  reach: number
  clicks: number
  orders: number
  revenue: number
  ctaUrl: string
  audience: string
  message?: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockCampaigns: Campaign[] = [
  {
    id: "c1", name: "Mother's Day Sale 🌸", status: "active", goal: "sales",
    channels: ["whatsapp", "instagram"], startDate: "May 5, 2026", endDate: "May 12, 2026",
    reach: 2840, clicks: 412, orders: 67, revenue: 1239500,
    ctaUrl: "lummy.co/your-store?utm_campaign=mothers-day",
    audience: "All customers",
    message: "Hi! 🌸 Mother's Day is around the corner. Treat your mum to something special — 15% off all orders this week only! Shop now 👇",
  },
  {
    id: "c2", name: "New Ankara Collection Drop", status: "scheduled", goal: "sales",
    channels: ["instagram", "tiktok"], startDate: "May 15, 2026",
    reach: 0, clicks: 0, orders: 0, revenue: 0,
    ctaUrl: "lummy.co/your-store/new-arrivals",
    audience: "VIP customers",
  },
  {
    id: "c3", name: "Restock Alert — Leather Bags", status: "ended", goal: "restock",
    channels: ["whatsapp"], startDate: "Apr 18, 2026", endDate: "Apr 25, 2026",
    reach: 1340, clicks: 289, orders: 43, revenue: 645000,
    ctaUrl: "lummy.co/your-store/leather-bag",
    audience: "All customers",
    message: "They're BACK! 🛍️ Our bestselling leather mini bags are restocked. Limited qty — grab yours before they sell out again!",
  },
  {
    id: "c4", name: "Win Back At-Risk Customers", status: "ended", goal: "reengagement",
    channels: ["whatsapp"], startDate: "Apr 1, 2026", endDate: "Apr 7, 2026",
    reach: 320, clicks: 87, orders: 18, revenue: 270000,
    ctaUrl: "lummy.co/your-store",
    audience: "At-risk customers",
    message: "Hi! We miss you 💜 It's been a while — here's a 10% discount code just for you: COMEBACK10. Valid for 7 days!",
  },
  {
    id: "c5", name: "Summer Body Promo", status: "draft", goal: "awareness",
    channels: ["instagram", "tiktok"], startDate: "Jun 1, 2026",
    reach: 0, clicks: 0, orders: 0, revenue: 0,
    ctaUrl: "lummy.co/your-store/summer",
    audience: "All customers",
  },
]

// ─── Constants ─────────────────────────────────────────────────────────────────

const statusConfig: Record<CampaignStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  active:    { label: "Active",     color: "text-brand-green",  bg: "bg-brand-green/10",  border: "border-brand-green/20",  dot: "bg-brand-green" },
  scheduled: { label: "Scheduled",  color: "text-brand-purple", bg: "bg-brand-purple/10", border: "border-brand-purple/20", dot: "bg-brand-purple" },
  draft:     { label: "Draft",      color: "text-muted-foreground", bg: "bg-muted",       border: "border-border",           dot: "bg-muted-foreground" },
  ended:     { label: "Ended",      color: "text-muted-foreground", bg: "bg-muted",       border: "border-border",           dot: "bg-muted-foreground/40" },
}

const goalConfig: Record<CampaignGoal, { label: string; icon: React.ElementType; color: string }> = {
  sales:        { label: "Drive Sales",    icon: TrendingUp,  color: "text-brand-purple" },
  awareness:    { label: "Awareness",      icon: Eye,         color: "text-brand-coral" },
  restock:      { label: "Restock Alert",  icon: Megaphone,   color: "text-amber-500" },
  reengagement: { label: "Re-engagement",  icon: Users,       color: "text-[#25D366]" },
}

const channelConfig: Record<CampaignChannel, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  whatsapp:  { icon: MessageCircle, label: "WhatsApp",  color: "text-[#25D366]", bg: "bg-[#25D366]/10" },
  instagram: { icon: Instagram,     label: "Instagram", color: "text-pink-500",  bg: "bg-pink-500/10" },
  tiktok:    { icon: Music2,        label: "TikTok",    color: "text-foreground", bg: "bg-muted" },
}

const audienceOptions = ["All customers", "VIP customers", "Repeat buyers", "New customers", "At-risk customers"]
const goalOptions: { id: CampaignGoal; label: string; desc: string }[] = [
  { id: "sales",        label: "Drive Sales",    desc: "Promote a product or collection" },
  { id: "awareness",    label: "Awareness",      desc: "Grow reach and brand visibility" },
  { id: "restock",      label: "Restock Alert",  desc: "Notify customers of restocked items" },
  { id: "reengagement", label: "Re-engagement",  desc: "Win back inactive customers" },
]

const FILTERS: CampaignStatus[] = ["active", "scheduled", "draft", "ended"]

// ─── KPI summary ──────────────────────────────────────────────────────────────

function KpiRow({ campaigns }: { campaigns: Campaign[] }) {
  const active = campaigns.filter(c => c.status === "active")
  const totalReach = campaigns.reduce((s, c) => s + c.reach, 0)
  const totalOrders = campaigns.reduce((s, c) => s + c.orders, 0)
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)

  const stats = [
    { label: "Active campaigns", value: String(active.length), icon: Zap,        color: "text-brand-green" },
    { label: "Total reach",      value: totalReach >= 1000 ? `${(totalReach / 1000).toFixed(1)}k` : String(totalReach), icon: Eye, color: "text-brand-purple" },
    { label: "Orders driven",    value: String(totalOrders), icon: BarChart3,    color: "text-brand-coral" },
    { label: "Revenue unlocked", value: `₦${(totalRevenue / 1000).toFixed(0)}k`, icon: TrendingUp, color: "text-amber-500" },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
          </div>
          <p className="font-display text-xl font-extrabold">{stat.value}</p>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign, index, onSelect }: { campaign: Campaign; index: number; onSelect: () => void }) {
  const [copied, setCopied] = React.useState(false)
  const status = statusConfig[campaign.status]
  const goal = goalConfig[campaign.goal]
  const GoalIcon = goal.icon
  const ctr = campaign.reach > 0 ? ((campaign.clicks / campaign.reach) * 100).toFixed(1) : "—"
  const cvr = campaign.clicks > 0 ? ((campaign.orders / campaign.clicks) * 100).toFixed(1) : "—"

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://${campaign.ctaUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-brand-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
      onClick={onSelect}
    >
      {/* Top bar: status + channels */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border", status.bg, status.color, status.border)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          {status.label}
        </span>
        <div className="flex gap-1">
          {campaign.channels.map(ch => {
            const cfg = channelConfig[ch]
            const Icon = cfg.icon
            return (
              <div key={ch} className={cn("flex h-6 w-6 items-center justify-center rounded-lg", cfg.bg)} title={cfg.label}>
                <Icon className={cn("h-3 w-3", cfg.color)} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Name + goal */}
      <div className="px-4 pb-3">
        <h3 className="font-semibold text-sm truncate">{campaign.name}</h3>
        <div className={cn("flex items-center gap-1 mt-1", goal.color)}>
          <GoalIcon className="h-3 w-3" />
          <span className="text-xs font-medium">{goal.label}</span>
        </div>
      </div>

      {/* Stats (non-draft) */}
      {campaign.status !== "draft" && campaign.reach > 0 ? (
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
          {[
            { label: "Reach",  value: campaign.reach >= 1000 ? `${(campaign.reach / 1000).toFixed(1)}k` : String(campaign.reach) },
            { label: "CTR",    value: `${ctr}%` },
            { label: "Orders", value: String(campaign.orders) },
          ].map(stat => (
            <div key={stat.label} className="px-3 py-3 text-center">
              <p className="font-display font-bold text-sm">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 pb-3 border-t border-border pt-3">
          <p className="text-[11px] text-muted-foreground">
            {campaign.status === "draft" ? "Draft — not yet published" : `Scheduled for ${campaign.startDate}`}
          </p>
        </div>
      )}

      {/* CTA url row */}
      <div className="px-4 py-2.5 border-t border-border flex items-center justify-between gap-2 bg-muted/30">
        <p className="text-[10px] text-muted-foreground font-mono truncate flex-1">{campaign.ctaUrl}</p>
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={copyUrl} className="flex h-5 items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <CheckCheck className="h-3 w-3 text-brand-green" /> : <Copy className="h-3 w-3" />}
          </button>
          <a href={`https://${campaign.ctaUrl}`} target="_blank" rel="noopener noreferrer"
            className="flex h-5 items-center text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Dates */}
      <div className="px-4 py-2.5 border-t border-border flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>{campaign.startDate}{campaign.endDate ? ` → ${campaign.endDate}` : " (no end date)"}</span>
        <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  )
}

// ─── Create Drawer ─────────────────────────────────────────────────────────────

interface NewCampaignForm {
  name: string
  goal: CampaignGoal
  channels: CampaignChannel[]
  audience: string
  startDate: string
  message: string
}

const emptyForm: NewCampaignForm = {
  name: "", goal: "sales", channels: ["whatsapp"], audience: "All customers", startDate: "", message: "",
}

function CreateDrawer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (c: Campaign) => void }) {
  const [form, setForm] = React.useState<NewCampaignForm>(emptyForm)
  const [saving, setSaving] = React.useState(false)
  const [aiGenerating, setAiGenerating] = React.useState(false)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  React.useEffect(() => {
    if (!open) { setForm(emptyForm); setSaving(false) }
  }, [open])

  const set = <K extends keyof NewCampaignForm>(k: K, v: NewCampaignForm[K]) => setForm(f => ({ ...f, [k]: v }))

  const toggleChannel = (ch: CampaignChannel) =>
    setForm(f => ({ ...f, channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch] }))

  const AI_MESSAGES: Record<CampaignGoal, string> = {
    sales:        "Hi! 🔥 We've got something amazing for you. Our latest collection just dropped and the pieces are STUNNING. Limited stock — shop now before they're gone! Tap the link to see everything 👇",
    awareness:    "Hey! 👋 Have you seen what we've been creating lately? Our store is full of handcrafted, uniquely African pieces you'll absolutely love. Come explore — new arrivals every week! 🛍️",
    restock:      "Great news! 🎉 Our bestselling items are finally BACK in stock. These sold out in days last time, so don't sleep on this one. Grab yours now before we run out again! 🏃🏾‍♀️",
    reengagement: "Hey, it's been a while and we miss you! 💜 We've got some exciting new pieces we think you'll love. Here's a special discount just for you — use code WELCOME10 for 10% off your next order! 🎁",
  }

  const generateMessage = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setAiGenerating(true)
    const full = AI_MESSAGES[form.goal]
    let i = 0
    setForm(f => ({ ...f, message: "" }))
    intervalRef.current = setInterval(() => {
      i += 3
      setForm(f => ({ ...f, message: full.slice(0, i) }))
      if (i >= full.length) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        setAiGenerating(false)
      }
    }, 16)
  }

  React.useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const handleSave = (asDraft?: boolean) => {
    if (!form.name.trim()) { toast({ title: "Enter a campaign name", variant: "default" }); return }
    setSaving(true)
    setTimeout(() => {
      const newCampaign: Campaign = {
        id: `c${Date.now()}`,
        name: form.name,
        status: asDraft ? "draft" : (form.startDate && new Date(form.startDate) > new Date() ? "scheduled" : "active"),
        goal: form.goal,
        channels: form.channels,
        startDate: form.startDate || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        reach: 0, clicks: 0, orders: 0, revenue: 0,
        audience: form.audience,
        ctaUrl: `lummy.co/your-store?utm_campaign=${form.name.toLowerCase().replace(/\s+/g, "-")}`,
        message: form.message,
      }
      setSaving(false)
      onCreated(newCampaign)
      toast({
        title: asDraft ? "Campaign saved as draft" : "Campaign launched! 🚀",
        description: `"${form.name}" is ${asDraft ? "saved as a draft" : "now live"}.`,
        variant: "success",
      })
    }, 900)
  }

  if (!open) return null

  const inputCls = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30"

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-background shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-base">New Campaign</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Set up a marketing push across your channels</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5">Campaign name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Mother's Day Sale" className={inputCls} />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-xs font-semibold mb-2">Goal</label>
            <div className="grid grid-cols-2 gap-2">
              {goalOptions.map(g => (
                <button key={g.id} onClick={() => set("goal", g.id)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    form.goal === g.id ? "border-brand-purple/40 bg-brand-purple/5" : "border-border hover:border-foreground/20"
                  )}>
                  <p className={cn("text-xs font-bold", form.goal === g.id ? "text-brand-purple" : "text-foreground")}>{g.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div>
            <label className="block text-xs font-semibold mb-2">Channels</label>
            <div className="flex gap-2">
              {(["whatsapp", "instagram", "tiktok"] as const).map(ch => {
                const cfg = channelConfig[ch]
                const Icon = cfg.icon
                const selected = form.channels.includes(ch)
                return (
                  <button key={ch} onClick={() => toggleChannel(ch)}
                    className={cn(
                      "flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold transition-all",
                      selected ? cn(cfg.bg, "border-transparent", cfg.color) : "border-border text-muted-foreground hover:border-foreground/20"
                    )}>
                    <Icon className="h-3.5 w-3.5" />{cfg.label}
                    {selected && <Check className="h-3 w-3 ml-0.5" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-xs font-semibold mb-1.5">Target audience</label>
            <select value={form.audience} onChange={e => set("audience", e.target.value)} className={cn(inputCls, "cursor-pointer")}>
              {audienceOptions.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          {/* Start date */}
          <div>
            <label className="block text-xs font-semibold mb-1.5">Start date <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)}
              className={cn(inputCls, "text-sm")} />
          </div>

          {/* Message / CTA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold">Campaign message</label>
              <button onClick={generateMessage} disabled={aiGenerating}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-purple hover:text-brand-purple/80 disabled:opacity-60 transition-colors">
                {aiGenerating ? <><Loader2 className="h-3 w-3 animate-spin" />Writing…</> : <><Sparkles className="h-3 w-3" />Generate with AI</>}
              </button>
            </div>
            <textarea value={form.message} onChange={e => set("message", e.target.value)}
              placeholder="Write your campaign message… or use AI to generate one ✨"
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30 leading-relaxed" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border px-5 py-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleSave(true)} disabled={saving}>
            Save as draft
          </Button>
          <Button size="sm" className="flex-1 gap-1.5" onClick={() => handleSave(false)} disabled={saving || !form.name.trim()}>
            {saving
              ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Launching…</>
              : <><Zap className="h-3.5 w-3.5" />Launch Campaign</>}
          </Button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ campaign, onClose, onToggle }: { campaign: Campaign; onClose: () => void; onToggle: () => void }) {
  const status = statusConfig[campaign.status]
  const goal = goalConfig[campaign.goal]
  const GoalIcon = goal.icon
  const [copied, setCopied] = React.useState(false)

  const ctr = campaign.reach > 0 ? ((campaign.clicks / campaign.reach) * 100).toFixed(1) : "0.0"
  const cvr = campaign.clicks > 0 ? ((campaign.orders / campaign.clicks) * 100).toFixed(1) : "0.0"

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://${campaign.ctaUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-border bg-background shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-bold text-sm truncate">{campaign.name}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Status + goal */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border", status.bg, status.color, status.border)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />{status.label}
            </span>
            <div className={cn("flex items-center gap-1.5 text-xs font-medium", goal.color)}>
              <GoalIcon className="h-3.5 w-3.5" />{goal.label}
            </div>
            {(campaign.status === "active" || campaign.status === "draft") && (
              <button onClick={onToggle}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                {campaign.status === "active" ? <ToggleRight className="h-3.5 w-3.5 text-brand-green" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                {campaign.status === "active" ? "Pause" : "Activate"}
              </button>
            )}
          </div>

          {/* Performance grid */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Performance</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Reach",   value: campaign.reach.toLocaleString() },
                { label: "Clicks",  value: campaign.clicks.toLocaleString() },
                { label: "CTR",     value: `${ctr}%` },
                { label: "CVR",     value: `${cvr}%` },
                { label: "Orders",  value: String(campaign.orders) },
                { label: "Revenue", value: `₦${(campaign.revenue / 1000).toFixed(0)}k` },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-muted/50 p-3">
                  <p className="font-display font-bold text-base">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Channels</p>
            <div className="flex gap-2">
              {campaign.channels.map(ch => {
                const cfg = channelConfig[ch]
                const Icon = cfg.icon
                return (
                  <div key={ch} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold", cfg.bg, cfg.color)}>
                    <Icon className="h-3.5 w-3.5" />{cfg.label}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Details */}
          <div className="px-5 py-4 border-b border-border space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Audience</span>
              <span className="font-medium">{campaign.audience}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start date</span>
              <span className="font-medium">{campaign.startDate}</span>
            </div>
            {campaign.endDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">End date</span>
                <span className="font-medium">{campaign.endDate}</span>
              </div>
            )}
          </div>

          {/* CTA URL */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Campaign link</p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
              <p className="text-xs font-mono flex-1 truncate text-muted-foreground">{campaign.ctaUrl}</p>
              <button onClick={copyUrl} className="flex-shrink-0">
                {copied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />}
              </button>
            </div>
          </div>

          {/* Message */}
          {campaign.message && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Campaign message</p>
              <div className="p-3 rounded-xl bg-[#25D366]/5 border border-[#25D366]/20">
                <p className="text-xs leading-relaxed text-foreground">{campaign.message}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-border px-5 py-4">
          <a href={`https://${campaign.ctaUrl}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="w-full gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> Open campaign link
            </Button>
          </a>
        </div>
      </motion.div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(mockCampaigns)
  const [activeFilter, setActiveFilter] = React.useState<"all" | CampaignStatus>("all")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedCampaign, setSelectedCampaign] = React.useState<Campaign | null>(null)

  const filtered = activeFilter === "all" ? campaigns : campaigns.filter(c => c.status === activeFilter)

  const toggleCampaignStatus = (campaign: Campaign) => {
    const nextStatus: CampaignStatus = campaign.status === "active" ? "draft" : "active"
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: nextStatus } : c))
    setSelectedCampaign(prev => prev?.id === campaign.id ? { ...prev, status: nextStatus } : prev)
    toast({ title: nextStatus === "active" ? "Campaign activated" : "Campaign paused", variant: "success" })
  }

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Plan and track your marketing pushes across channels</p>
          </div>
          <Button size="sm" className="gap-2 self-start sm:self-auto" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        </div>

        {/* KPIs */}
        <KpiRow campaigns={campaigns} />

        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted border border-border w-fit">
          <button onClick={() => setActiveFilter("all")}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              activeFilter === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            All ({campaigns.length})
          </button>
          {FILTERS.map(f => {
            const count = campaigns.filter(c => c.status === f).length
            if (count === 0) return null
            return (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize",
                  activeFilter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {statusConfig[f].label} ({count})
              </button>
            )
          })}
        </div>

        {/* Campaign grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((campaign, i) => (
              <CampaignCard key={campaign.id} campaign={campaign} index={i}
                onSelect={() => setSelectedCampaign(campaign)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 text-muted-foreground">
            <Megaphone className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-semibold">No campaigns yet</p>
            <p className="text-sm mt-1">Launch your first marketing campaign to start driving sales.</p>
            <Button size="sm" className="mt-4 gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create campaign
            </Button>
          </div>
        )}
      </div>

      {/* Drawers */}
      <AnimatePresence>
        {createOpen && (
          <CreateDrawer
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreated={(c) => { setCampaigns(prev => [c, ...prev]); setCreateOpen(false) }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCampaign && (
          <DetailDrawer
            campaign={selectedCampaign}
            onClose={() => setSelectedCampaign(null)}
            onToggle={() => toggleCampaignStatus(selectedCampaign)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
