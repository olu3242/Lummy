"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"
import {
  TrendingUp, ShoppingBag, Eye, MessageCircle,
  ArrowUpRight, ArrowDownRight, Target, Edit2, CheckCheck,
  Trophy, Download, Sparkles, Users, MapPin,
  AlertTriangle, Lightbulb, RefreshCw, ShoppingCart,
  UserCheck, UserPlus, BarChart2, Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

// ─── Data ─────────────────────────────────────────────────────────────────────

const GOAL_KEY = "lummy_revenue_goal"

const revenueData = [
  { month: "Jan", revenue: 285000, orders: 42, views: 1820, prev: 241000, aov: 6786 },
  { month: "Feb", revenue: 312000, orders: 51, views: 2100, prev: 267000, aov: 6118 },
  { month: "Mar", revenue: 298000, orders: 48, views: 1950, prev: 255000, aov: 6208 },
  { month: "Apr", revenue: 425000, orders: 67, views: 2840, prev: 361000, aov: 6343 },
  { month: "May", revenue: 389000, orders: 58, views: 2600, prev: 310000, aov: 6707 },
  { month: "Jun", revenue: 467000, orders: 74, views: 3200, prev: 400000, aov: 6311 },
  { month: "Jul", revenue: 512000, orders: 82, views: 3750, prev: 438000, aov: 6244 },
  { month: "Aug", revenue: 448000, orders: 70, views: 3100, prev: 381000, aov: 6400 },
  { month: "Sep", revenue: 534000, orders: 88, views: 4020, prev: 461000, aov: 6068 },
  { month: "Oct", revenue: 591000, orders: 94, views: 4380, prev: 505000, aov: 6287 },
  { month: "Nov", revenue: 623000, orders: 99, views: 4700, prev: 526000, aov: 6293 },
  { month: "Dec", revenue: 718000, orders: 112, views: 5240, prev: 611000, aov: 6411 },
]

const weeklyConversionData = [
  { day: "Mon", views: 312, clicks: 87,  orders: 14 },
  { day: "Tue", views: 280, clicks: 72,  orders: 11 },
  { day: "Wed", views: 398, clicks: 118, orders: 19 },
  { day: "Thu", views: 425, clicks: 134, orders: 22 },
  { day: "Fri", views: 512, clicks: 167, orders: 28 },
  { day: "Sat", views: 634, clicks: 201, orders: 34 },
  { day: "Sun", views: 489, clicks: 152, orders: 25 },
]

const trafficSourceData = [
  { name: "WhatsApp",    value: 58, color: "#25D366" },
  { name: "Direct Link", value: 24, color: "#6C4EF3" },
  { name: "Instagram",   value: 11, color: "#E1306C" },
  { name: "TikTok",      value:  7, color: "#3B82F6" },
]

const topProductsData = [
  { name: "Ankara Print Dress",    views: 1842, orders: 89, revenue: 890000,  growth: 23 },
  { name: "Beaded Necklace Set",   views: 1234, orders: 67, revenue: 603000,  growth: 15 },
  { name: "Leather Mini Bag",      views:  987, orders: 45, revenue: 675000,  growth: -4 },
  { name: "Embroidered Set",       views:  876, orders: 38, revenue: 570000,  growth: 31 },
  { name: "Gold Hoop Earrings",    views:  743, orders: 52, revenue: 364000,  growth:  8 },
  { name: "Silk Blouse",           views:  612, orders: 29, revenue: 261000,  growth: -11 },
]

const locationData = [
  { city: "Lagos",    customers: 187, pct: 73, color: "#6C4EF3" },
  { city: "Abuja",    customers:  28, pct: 11, color: "#10B981" },
  { city: "Port Harcourt", customers: 18, pct: 7, color: "#F97316" },
  { city: "Ibadan",   customers:  12, pct:  5, color: "#F59E0B" },
  { city: "Other",    customers:  11, pct:  4, color: "#94A3B8" },
]

const hourlyData = [
  { hour: "12a", orders: 1 }, { hour: "1a",  orders: 0 }, { hour: "2a",  orders: 0 },
  { hour: "3a",  orders: 0 }, { hour: "4a",  orders: 1 }, { hour: "5a",  orders: 2 },
  { hour: "6a",  orders: 4 }, { hour: "7a",  orders: 7 }, { hour: "8a",  orders: 12 },
  { hour: "9a",  orders: 18 }, { hour: "10a", orders: 22 }, { hour: "11a", orders: 19 },
  { hour: "12p", orders: 24 }, { hour: "1p",  orders: 21 }, { hour: "2p",  orders: 17 },
  { hour: "3p",  orders: 14 }, { hour: "4p",  orders: 19 }, { hour: "5p",  orders: 28 },
  { hour: "6p",  orders: 34 }, { hour: "7p",  orders: 38 }, { hour: "8p",  orders: 31 },
  { hour: "9p",  orders: 26 }, { hour: "10p", orders: 18 }, { hour: "11p", orders: 9 },
]

const whatsappFunnel = [
  { label: "Store visits",         value: 4700, pct: 100 },
  { label: "Clicked 'Order on WA'", value: 1316, pct: 28 },
  { label: "Opened WhatsApp",      value:  987, pct: 21 },
  { label: "Sent a message",       value:  618, pct: 13 },
  { label: "Placed an order",      value:  365, pct:  8 },
]

const kpiStats = [
  { label: "Total Revenue",    value: "₦5.1M",  change: "+18%",  up: true,  icon: TrendingUp,    color: "text-brand-purple", prevValue: "₦4.3M" },
  { label: "Total Orders",     value: "885",    change: "+24%",  up: true,  icon: ShoppingBag,   color: "text-brand-green",  prevValue: "714" },
  { label: "Store Views",      value: "39.7K",  change: "+31%",  up: true,  icon: Eye,           color: "text-brand-coral",  prevValue: "30.3K" },
  { label: "Conversion Rate",  value: "2.23%",  change: "-0.3%", up: false, icon: MessageCircle, color: "text-amber-500",    prevValue: "2.53%" },
]

interface AIInsight { type: "success" | "warning" | "tip"; title: string; body: string }
const AI_INSIGHTS: AIInsight[] = [
  { type: "success", title: "Best revenue month on record",    body: "Nov 2026 (₦623K) is your highest ever. Dec is projected at ₦718K — keep the momentum with a year-end push." },
  { type: "warning", title: "Conversion rate declining",       body: "At 2.23%, your conversion is down 0.3pp. More visitors are browsing but not clicking 'Order' — review your product CTAs." },
  { type: "tip",     title: "Peak hours are 6–8pm weekdays",   body: "38% of orders come in between 6pm–8pm. Schedule broadcasts and new-drop announcements for 5:30pm to catch peak intent." },
  { type: "success", title: "WhatsApp drives 58% of traffic",  body: "Your link-in-bio WhatsApp CTA is working. Customers from WhatsApp convert at 3.1× vs direct — double down on it." },
]

// New vs returning customers data
const customerSplitData = [
  { name: "Returning", value: 62, color: "#6C4EF3" },
  { name: "New",       value: 38, color: "#10B981" },
]

// Revenue by channel (monthly sum per source)
const channelRevenueData = [
  { channel: "WhatsApp",    revenue: 2958000, pct: 58, color: "#25D366" },
  { channel: "Direct Link", revenue: 1224000, pct: 24, color: "#6C4EF3" },
  { channel: "Instagram",   revenue:  561300, pct: 11, color: "#E1306C" },
  { channel: "TikTok",      revenue:  357000, pct:  7, color: "#3B82F6" },
]

// Day-of-week revenue pattern
const dowRevenueData = [
  { day: "Mon", revenue: 520000, orders: 82  },
  { day: "Tue", revenue: 468000, orders: 74  },
  { day: "Wed", revenue: 634000, orders: 101 },
  { day: "Thu", revenue: 712000, orders: 114 },
  { day: "Fri", revenue: 891000, orders: 142 },
  { day: "Sat", revenue: 1043000, orders: 167 },
  { day: "Sun", revenue: 932000, orders: 148 },
]

// ─── Components ───────────────────────────────────────────────────────────────

function RevenueGoalCard({ currentRevenue }: { currentRevenue: number }) {
  const [goal, setGoal] = React.useState<number>(800000)
  const [editing, setEditing] = React.useState(false)
  const [inputVal, setInputVal] = React.useState("")

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(GOAL_KEY)
      if (v) setGoal(Number(v))
    } catch {}
  }, [])

  const pct = Math.min(100, Math.round((currentRevenue / goal) * 100))
  const remaining = Math.max(0, goal - currentRevenue)
  const achieved = pct >= 100

  const saveGoal = () => {
    const n = Number(inputVal.replace(/\D/g, ""))
    if (n > 0) { setGoal(n); try { localStorage.setItem(GOAL_KEY, String(n)) } catch {} }
    setEditing(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className={cn("rounded-2xl border bg-card p-5", achieved ? "border-brand-green/30 bg-brand-green/5" : "border-border")}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", achieved ? "bg-brand-green/15" : "bg-brand-purple/10")}>
            {achieved ? <Trophy className="h-4 w-4 text-brand-green" /> : <Target className="h-4 w-4 text-brand-purple" />}
          </div>
          <div>
            <p className="text-sm font-semibold">{achieved ? "Goal achieved! 🎉" : "Monthly Revenue Goal"}</p>
            <p className="text-[10px] text-muted-foreground">May 2026</p>
          </div>
        </div>
        {!editing
          ? <button onClick={() => { setInputVal(String(goal)); setEditing(true) }} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><Edit2 className="h-3.5 w-3.5" /></button>
          : <button onClick={saveGoal} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-brand-green"><CheckCheck className="h-3.5 w-3.5" /></button>
        }
      </div>

      {editing ? (
        <div className="mb-4">
          <div className="flex items-center gap-0">
            <div className="flex items-center px-3 h-9 rounded-l-xl border border-r-0 border-border bg-muted text-sm text-muted-foreground">₦</div>
            <input autoFocus value={inputVal} onChange={e => setInputVal(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => e.key === "Enter" && saveGoal()} placeholder="e.g. 1000000"
              className="flex-1 h-9 px-3 rounded-r-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Press Enter or ✓ to save</p>
        </div>
      ) : (
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="font-display text-2xl font-extrabold">₦{currentRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">of ₦{goal.toLocaleString()} goal</p>
          </div>
          <p className={cn("font-display text-3xl font-extrabold", achieved ? "text-brand-green" : "text-brand-purple")}>{pct}%</p>
        </div>
      )}

      {!editing && (
        <>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-3">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
              className={cn("h-full rounded-full", achieved ? "bg-brand-green" : "bg-brand-purple")} />
          </div>
          {!achieved
            ? <p className="text-xs text-muted-foreground"><strong className="text-foreground">₦{remaining.toLocaleString()}</strong> to go — you&apos;re on track! Keep pushing 🚀</p>
            : <p className="text-xs text-brand-green font-semibold">You&apos;ve crushed your May goal. Set a new one! 🏆</p>
          }
        </>
      )}
    </motion.div>
  )
}

interface TooltipEntry { dataKey: string; color: string; value: number }
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm px-3 py-2.5 text-xs shadow-lg">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-20 text-muted-foreground capitalize">{p.dataKey}:</span>
          <span className="font-semibold">{p.dataKey === "revenue" || p.dataKey === "prev" || p.dataKey === "aov" ? `₦${Number(p.value).toLocaleString()}` : p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  )
}

function exportAnalyticsCSV(period: "3m" | "6m" | "12m") {
  const slice = period === "3m" ? revenueData.slice(-3) : period === "6m" ? revenueData.slice(-6) : revenueData
  const header = ["Month", "Revenue (₦)", "Prev Revenue (₦)", "Orders", "Store Views", "AOV (₦)"]
  const rows = slice.map(r => [r.month, r.revenue, r.prev, r.orders, r.views, r.aov].join(","))
  const csv = [header.join(","), ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = `lummy-analytics-${period}.csv`; a.click()
  URL.revokeObjectURL(url)
  toast({ title: "Exported", description: `Analytics ${period} downloaded.`, variant: "success" })
}

// AOV sparkline (SVG inline)
function AOVSparkline() {
  const values = revenueData.map(d => d.aov)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const w = 120, h = 36
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")
  const latest = values[values.length - 1]
  const prev = values[values.length - 2]
  const up = latest >= prev

  return (
    <div className="flex items-end gap-3">
      <div>
        <p className="font-display text-2xl font-extrabold">₦{latest.toLocaleString()}</p>
        <div className={cn("flex items-center gap-1 mt-0.5 text-xs font-semibold", up ? "text-brand-green" : "text-brand-coral")}>
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {up ? "+" : ""}{(((latest - prev) / prev) * 100).toFixed(1)}% vs last month
        </div>
      </div>
      <svg width={w} height={h} className="flex-shrink-0 mb-1">
        <defs>
          <linearGradient id="aovLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6C4EF3" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#6C4EF3" stopOpacity={1} />
          </linearGradient>
        </defs>
        <polyline points={pts} fill="none" stroke="url(#aovLine)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {/* endpoint dot */}
        <circle cx={w} cy={parseFloat(pts.split(" ").pop()!.split(",")[1])} r={3} fill="#6C4EF3" />
      </svg>
    </div>
  )
}

// Channel revenue horizontal bars
function ChannelRevenuePanel() {
  const total = channelRevenueData.reduce((s, d) => s + d.revenue, 0)
  return (
    <div className="space-y-3.5">
      {channelRevenueData.map((ch, i) => (
        <div key={ch.channel}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ch.color }} />
              <span className="text-xs font-semibold">{ch.channel}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold">₦{(ch.revenue / 1000).toFixed(0)}K</span>
              <span className="text-[10px] text-muted-foreground w-8 text-right">{ch.pct}%</span>
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${(ch.revenue / total) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: ch.color }}
            />
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
        Total YTD: <strong className="text-foreground">₦{(total / 1000000).toFixed(2)}M</strong>
      </p>
    </div>
  )
}

// New vs returning donut
function CustomerSplitDonut() {
  const returning = customerSplitData[0]
  const newC = customerSplitData[1]
  return (
    <div className="flex items-center gap-4">
      <div className="h-36 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={customerSplitData} cx="50%" cy="50%" innerRadius={38} outerRadius={56} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
              {customerSplitData.map((entry) => <Cell key={entry.name} fill={entry.color} opacity={0.9} />)}
            </Pie>
            <Tooltip formatter={(v) => `${v}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <UserCheck className="h-3.5 w-3.5 text-brand-purple" />
            <span className="text-xs font-semibold">Returning</span>
          </div>
          <p className="font-display text-xl font-extrabold text-brand-purple">{returning.value}%</p>
          <p className="text-[10px] text-muted-foreground">549 customers</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <UserPlus className="h-3.5 w-3.5 text-brand-green" />
            <span className="text-xs font-semibold">New</span>
          </div>
          <p className="font-display text-xl font-extrabold text-brand-green">{newC.value}%</p>
          <p className="text-[10px] text-muted-foreground">336 customers</p>
        </div>
      </div>
    </div>
  )
}

// Day-of-week revenue bars
function DayOfWeekChart() {
  const maxRev = Math.max(...dowRevenueData.map(d => d.revenue))
  const bestDay = dowRevenueData.reduce((best, d) => d.revenue > best.revenue ? d : best, dowRevenueData[0])
  return (
    <div>
      <div className="flex items-end gap-1.5 h-28">
        {dowRevenueData.map((d, i) => {
          const heightPct = (d.revenue / maxRev) * 100
          const isBest = d.day === bestDay.day
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-card border border-border rounded-lg px-2 py-1 text-[10px] whitespace-nowrap shadow-lg">
                  <p className="font-semibold">{d.day}</p>
                  <p className="text-muted-foreground">₦{(d.revenue / 1000).toFixed(0)}K · {d.orders} orders</p>
                </div>
              </div>
              <div className="relative w-full flex flex-col justify-end" style={{ height: "80px" }}>
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
                  className="w-full rounded-t-lg"
                  style={{
                    backgroundColor: isBest ? "#6C4EF3" : "#6C4EF3",
                    opacity: isBest ? 1 : 0.3 + (d.revenue / maxRev) * 0.5,
                  }}
                />
              </div>
              <span className={cn("text-[10px] font-semibold", isBest ? "text-brand-purple" : "text-muted-foreground")}>{d.day}</span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <p className="text-[11px] text-muted-foreground">
          Best day: <strong className="text-foreground">{bestDay.day}</strong> — avg ₦{(bestDay.revenue / 1000).toFixed(0)}K/week
        </p>
        <p className="text-[11px] text-muted-foreground">
          Weekends earn <strong className="text-foreground">2.1×</strong> weekday avg
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface LiveSummary { whatsapp_clicks: number; storefront_views: number; orders: number; revenue_ngn: number; conversion_rate: number }

export default function AnalyticsPage() {
  const [revPeriod, setRevPeriod] = React.useState<"3m" | "6m" | "12m">("12m")
  const [showComparison, setShowComparison] = React.useState(false)
  const [showInsights, setShowInsights] = React.useState(true)
  const [aovMetric, setAovMetric] = React.useState<"revenue" | "aov">("revenue")
  const [dismissedInsights, setDismissedInsights] = React.useState<Set<number>>(new Set())
  const [liveSummary, setLiveSummary] = React.useState<LiveSummary | null>(null)

  React.useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.ok ? r.json() : null)
      .then((data: { summary?: LiveSummary | null } | null) => {
        if (data?.summary) setLiveSummary(data.summary)
      })
      .catch(() => {})
  }, [])

  const revSlice = revPeriod === "3m" ? revenueData.slice(-3) : revPeriod === "6m" ? revenueData.slice(-6) : revenueData
  const peakHour = hourlyData.reduce((max, d) => d.orders > max.orders ? d : max, hourlyData[0])
  const hourMax = Math.max(...hourlyData.map(d => d.orders))

  const visibleInsights = AI_INSIGHTS.filter((_, i) => !dismissedInsights.has(i))

  // Current AOV
  const currentAOV = Math.round(revenueData[revenueData.length - 2].revenue / revenueData[revenueData.length - 2].orders)
  const prevAOV    = Math.round(revenueData[revenueData.length - 3].revenue / revenueData[revenueData.length - 3].orders)
  const aovChange  = (((currentAOV - prevAOV) / prevAOV) * 100).toFixed(1)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track your store performance and growth</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInsights(v => !v)}
            className={cn("flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold transition-colors",
              showInsights ? "bg-brand-purple/10 border-brand-purple/30 text-brand-purple" : "border-border bg-card hover:bg-accent")}
          >
            <Sparkles className="h-3.5 w-3.5" /> Insights
          </button>
          <button onClick={() => exportAnalyticsCSV(revPeriod)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-accent transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* AI Insights panel */}
      <AnimatePresence>
        {showInsights && visibleInsights.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-brand-purple" />
                <p className="text-sm font-bold text-brand-purple">AI Insights</p>
                <span className="text-[10px] text-muted-foreground ml-auto">{visibleInsights.length} active</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {visibleInsights.map((ins, vi) => {
                  const globalIdx = AI_INSIGHTS.indexOf(ins)
                  return (
                    <div key={globalIdx}
                      className={cn("rounded-xl border p-3 relative",
                        ins.type === "success" && "bg-brand-green/5 border-brand-green/20",
                        ins.type === "warning" && "bg-amber-500/5 border-amber-500/20",
                        ins.type === "tip"     && "bg-brand-purple/5 border-brand-purple/15",
                      )}>
                      <button onClick={() => setDismissedInsights(prev => { const n = new Set(prev); n.add(globalIdx); return n })}
                        className="absolute top-2 right-2 text-muted-foreground/60 hover:text-muted-foreground">
                        <ArrowDownRight className="h-3 w-3 rotate-45" />
                      </button>
                      <div className="flex items-start gap-2 pr-4">
                        {ins.type === "success" && <TrendingUp className="h-3.5 w-3.5 text-brand-green flex-shrink-0 mt-0.5" />}
                        {ins.type === "warning" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />}
                        {ins.type === "tip"     && <Lightbulb className="h-3.5 w-3.5 text-brand-purple flex-shrink-0 mt-0.5" />}
                        <div>
                          <p className="text-[11px] font-bold mb-0.5">{ins.title}</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{ins.body}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal tracker */}
      <RevenueGoalCard currentRevenue={liveSummary ? Math.round(liveSummary.revenue_ngn / 100) : 0} />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(liveSummary ? [
          { label: "Revenue (30d)",    value: `₦${(liveSummary.revenue_ngn / 100).toLocaleString("en-NG")}`, icon: TrendingUp,    color: "text-brand-purple" },
          { label: "Orders (30d)",     value: liveSummary.orders.toLocaleString(),                            icon: ShoppingBag,   color: "text-brand-green"  },
          { label: "Store Views (30d)", value: liveSummary.storefront_views.toLocaleString(),                 icon: Eye,           color: "text-brand-coral"  },
          { label: "WA Clicks (30d)",  value: liveSummary.whatsapp_clicks.toLocaleString(),                   icon: MessageCircle, color: "text-amber-500"    },
        ] : kpiStats).map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
            </div>
            <p className="font-display text-xl font-extrabold">{stat.value}</p>
            {"change" in stat ? (
              <>
                <div className={cn("flex items-center gap-1 mt-1 text-xs font-semibold", stat.up ? "text-brand-green" : "text-brand-coral")}>
                  {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.change} vs last year
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Prev: {stat.prevValue}</p>
              </>
            ) : (
              <p className="text-[10px] text-muted-foreground mt-1.5">Last 30 days · live</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Row: AOV trend + Customer split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AOV trend */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-purple/10">
                  <ShoppingCart className="h-3.5 w-3.5 text-brand-purple" />
                </div>
                <h2 className="font-display font-bold text-base">Avg order value</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 ml-9">12-month AOV trend</p>
            </div>
            <div className={cn("flex items-center gap-1 text-xs font-semibold", Number(aovChange) >= 0 ? "text-brand-green" : "text-brand-coral")}>
              {Number(aovChange) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {aovChange}%
            </div>
          </div>
          <AOVSparkline />
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex gap-4">
              <button onClick={() => setAovMetric("revenue")}
                className={cn("text-[11px] font-semibold pb-0.5 border-b-2 transition-colors",
                  aovMetric === "revenue" ? "border-brand-purple text-brand-purple" : "border-transparent text-muted-foreground hover:text-foreground")}>
                Revenue
              </button>
              <button onClick={() => setAovMetric("aov")}
                className={cn("text-[11px] font-semibold pb-0.5 border-b-2 transition-colors",
                  aovMetric === "aov" ? "border-brand-purple text-brand-purple" : "border-transparent text-muted-foreground hover:text-foreground")}>
                AOV
              </button>
            </div>
            <div className="h-24 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aovAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C4EF3" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6C4EF3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
                    tickFormatter={v => aovMetric === "revenue" ? `₦${(v / 1000).toFixed(0)}k` : `₦${(v / 1000).toFixed(1)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey={aovMetric} stroke="#6C4EF3" strokeWidth={1.5} fill="url(#aovAreaGrad)" dot={false} activeDot={{ r: 3, fill: "#6C4EF3" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* New vs returning customers */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-green/10">
              <Users className="h-3.5 w-3.5 text-brand-green" />
            </div>
            <h2 className="font-display font-bold text-base">Customer type</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4 ml-9">New vs returning — last 12 months</p>
          <CustomerSplitDonut />
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-muted/50 p-2.5">
              <p className="text-[10px] text-muted-foreground mb-0.5">Repeat rate</p>
              <p className="text-sm font-bold text-brand-purple">62%</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-2.5">
              <p className="text-[10px] text-muted-foreground mb-0.5">Avg orders (returning)</p>
              <p className="text-sm font-bold">3.2×</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Revenue chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div>
            <h2 className="font-display font-bold text-base">Revenue over time</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly revenue in Naira</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowComparison(v => !v)}
              className={cn("flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold border transition-all",
                showComparison ? "bg-brand-purple/10 border-brand-purple/20 text-brand-purple" : "border-border text-muted-foreground hover:text-foreground")}
            >
              <RefreshCw className="h-3 w-3" /> Compare
            </button>
            <div className="flex gap-1">
              {(["3m", "6m", "12m"] as const).map(p => (
                <button key={p} onClick={() => setRevPeriod(p)}
                  className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                    revPeriod === p ? "bg-brand-purple text-white" : "text-muted-foreground hover:text-foreground")}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        {showComparison && (
          <div className="flex items-center gap-4 mb-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-brand-purple/30 inline-block" />Previous year</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-brand-purple inline-block" />This year</span>
          </div>
        )}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revSlice} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C4EF3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C4EF3" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C4EF3" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#6C4EF3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              {showComparison && <Area type="monotone" dataKey="prev" stroke="#6C4EF3" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#prevGrad)" dot={false} strokeOpacity={0.4} />}
              <Area type="monotone" dataKey="revenue" stroke="#6C4EF3" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#6C4EF3" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Row: Revenue by channel + Day-of-week analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by channel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10">
              <BarChart2 className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <h2 className="font-display font-bold text-base">Revenue by channel</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5 ml-9">YTD earnings per traffic source</p>
          <ChannelRevenuePanel />
        </motion.div>

        {/* Day-of-week revenue */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-coral/10">
              <Calendar className="h-3.5 w-3.5 text-brand-coral" />
            </div>
            <h2 className="font-display font-bold text-base">Revenue by day of week</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5 ml-9">Weekly revenue pattern — monthly avg</p>
          <DayOfWeekChart />
        </motion.div>
      </div>

      {/* Row: Conversion funnel + Traffic sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly conversion */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display font-bold text-base mb-1">Weekly conversion</h2>
          <p className="text-xs text-muted-foreground mb-4">Views → Clicks → Orders</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyConversionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="views"  fill="#6C4EF3" fillOpacity={0.2} radius={[3, 3, 0, 0]} />
                <Bar dataKey="clicks" fill="#6C4EF3" fillOpacity={0.5} radius={[3, 3, 0, 0]} />
                <Bar dataKey="orders" fill="#6C4EF3" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Traffic sources */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display font-bold text-base mb-1">Traffic sources</h2>
          <p className="text-xs text-muted-foreground mb-4">Where your customers come from</p>
          <div className="flex items-center gap-4">
            <div className="h-48 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={trafficSourceData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                    {trafficSourceData.map((entry) => <Cell key={entry.name} fill={entry.color} opacity={0.85} />)}
                  </Pie>
                  <Tooltip formatter={v => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5 flex-shrink-0">
              {trafficSourceData.map(src => (
                <div key={src.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: src.color }} />
                  <div>
                    <p className="text-xs font-semibold">{src.name}</p>
                    <p className="text-[10px] text-muted-foreground">{src.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row: WhatsApp funnel + Location breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* WhatsApp conversion funnel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display font-bold text-base mb-1 flex items-center gap-2">
            <span className="text-[#25D366] text-sm">●</span> WhatsApp funnel
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Store visits → orders this month</p>
          <div className="space-y-2.5">
            {whatsappFunnel.map((step, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{step.value.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{step.pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${step.pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: i === 0 ? "#6C4EF3" : `rgba(108,78,243,${1 - i * 0.15})` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[11px] text-muted-foreground">
              Overall conversion: <strong className="text-foreground">7.8%</strong> of visitors become buyers via WhatsApp.
            </p>
          </div>
        </motion.div>

        {/* Customer locations */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display font-bold text-base mb-1 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-coral" /> Customer locations
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            <Users className="h-3 w-3 inline mr-1" />
            {locationData.reduce((s, d) => s + d.customers, 0)} total customers
          </p>
          <div className="space-y-3">
            {locationData.map((loc, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{loc.city}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{loc.customers} customers</span>
                    <span className="text-[10px] font-bold w-8 text-right">{loc.pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${loc.pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: loc.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 pt-4 border-t border-border">
            73% Lagos concentration — consider targeting Abuja and Port Harcourt for growth.
          </p>
        </motion.div>
      </div>

      {/* Hour-of-day heatmap */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-base">Order activity by hour</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Peak: <strong className="text-foreground">{peakHour.hour}</strong> ({peakHour.orders} orders) · Weekday average
            </p>
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-brand-purple/20 inline-block" /> Low
            <span className="w-3 h-3 rounded-sm bg-brand-purple inline-block ml-1" /> High
          </div>
        </div>
        <div className="flex items-end gap-0.5 h-20 mt-2">
          {hourlyData.map((d, i) => {
            const heightPct = (d.orders / hourMax) * 100
            const isPeak = d.orders === hourMax
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-card border border-border rounded-lg px-2 py-1 text-[10px] whitespace-nowrap shadow-lg">
                    {d.hour}: {d.orders}
                  </div>
                </div>
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.5, delay: i * 0.02 }}
                  className="w-full rounded-t-sm"
                  style={{
                    backgroundColor: isPeak ? "#6C4EF3" : `rgba(108,78,243,${0.15 + (d.orders / hourMax) * 0.7})`,
                    minHeight: d.orders > 0 ? 2 : 0,
                  }}
                />
                {i % 4 === 0 && (
                  <span className="text-[8px] text-muted-foreground mt-0.5 absolute -bottom-4">{d.hour}</span>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-5" />
      </motion.div>

      {/* Top products performance table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-display font-bold text-base">Product performance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">This year vs last year</p>
        </div>
        <div className="hidden sm:grid grid-cols-[1fr_80px_80px_120px_80px] gap-4 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
          <span>Product</span><span>Views</span><span>Orders</span><span>Revenue</span><span>Growth</span>
        </div>
        <div className="divide-y divide-border">
          {topProductsData.map((product, i) => (
            <div key={product.name}
              className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_120px_80px] gap-2 sm:gap-4 px-5 py-3.5 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-purple/10 flex items-center justify-center text-[10px] font-bold text-brand-purple flex-shrink-0">{i + 1}</div>
                <p className="text-sm font-semibold">{product.name}</p>
              </div>
              <div className="flex sm:block items-center gap-2">
                <span className="text-xs text-muted-foreground sm:hidden">Views: </span>
                <p className="text-sm">{product.views.toLocaleString()}</p>
              </div>
              <div className="flex sm:block items-center gap-2">
                <span className="text-xs text-muted-foreground sm:hidden">Orders: </span>
                <p className="text-sm">{product.orders}</p>
              </div>
              <div className="flex sm:block items-center gap-2">
                <span className="text-xs text-muted-foreground sm:hidden">Revenue: </span>
                <p className="text-sm font-semibold text-brand-purple">₦{product.revenue.toLocaleString()}</p>
              </div>
              <div className="flex sm:block items-center gap-2">
                <span className="text-xs text-muted-foreground sm:hidden">Growth: </span>
                <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", product.growth >= 0 ? "text-brand-green" : "text-brand-coral")}>
                  {product.growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(product.growth)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Summary stats footer */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display font-bold text-base mb-4">Year-end summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total revenue",   value: "₦5.1M",  icon: TrendingUp,  color: "text-brand-purple" },
            { label: "Avg order value", value: `₦${currentAOV.toLocaleString()}`, icon: ShoppingCart, color: "text-amber-500" },
            { label: "Total customers", value: "885",    icon: Users,        color: "text-brand-green" },
            { label: "Repeat rate",     value: "62%",    icon: UserCheck,    color: "text-brand-indigo" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                  <s.icon className={cn("h-4 w-4", s.color)} />
                </div>
              </div>
              <p className="font-display text-xl font-extrabold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
