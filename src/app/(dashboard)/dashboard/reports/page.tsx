"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3, Download, FileText, TrendingUp, Users, ShoppingBag,
  Package, Calendar, ChevronDown, Check, ArrowUpRight, ArrowDownRight,
  RefreshCw, Mail, Clock, Star, Sparkles, Lightbulb, AlertTriangle,
  X, ChevronRight, Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type DateRange = "this_week" | "this_month" | "last_month" | "last_3_months" | "custom"
type ReportType = "revenue" | "orders" | "customers" | "products" | "inventory"

interface Report {
  id: ReportType
  label: string
  description: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
  metric: string
  metricLabel: string
  change: number
  sparkline: number[]
  prevMetric: string
}

interface ScheduleFreq { id: string; label: string }

interface AIInsight {
  type: "success" | "warning" | "tip"
  title: string
  body: string
}

const DATE_RANGES: { id: DateRange; label: string }[] = [
  { id: "this_week", label: "This week" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "last_3_months", label: "Last 3 months" },
  { id: "custom", label: "Custom range" },
]

const REPORTS: Report[] = [
  {
    id: "revenue",
    label: "Revenue",
    description: "Total revenue, average order value, refunds and net income breakdown.",
    icon: TrendingUp,
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
    border: "border-brand-purple/20",
    metric: "₦312,500",
    prevMetric: "₦263,900",
    metricLabel: "Net revenue",
    change: 18.4,
    sparkline: [42, 55, 48, 70, 65, 82, 78],
  },
  {
    id: "orders",
    label: "Orders",
    description: "Order volume by status, delivery performance and fulfilment rate.",
    icon: ShoppingBag,
    color: "text-brand-green",
    bg: "bg-brand-green/10",
    border: "border-brand-green/20",
    metric: "147",
    prevMetric: "132",
    metricLabel: "Total orders",
    change: 11.2,
    sparkline: [18, 22, 19, 28, 24, 32, 29],
  },
  {
    id: "customers",
    label: "Customers",
    description: "New vs returning customers, top locations, WhatsApp engagement rate.",
    icon: Users,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    metric: "89",
    prevMetric: "71",
    metricLabel: "New customers",
    change: 24.7,
    sparkline: [10, 14, 11, 18, 16, 22, 24],
  },
  {
    id: "products",
    label: "Products",
    description: "Best-selling products by revenue and units sold, category breakdown.",
    icon: Star,
    color: "text-brand-coral",
    bg: "bg-brand-coral/10",
    border: "border-brand-coral/20",
    metric: "23",
    prevMetric: "24",
    metricLabel: "Active listings",
    change: -3.1,
    sparkline: [24, 24, 23, 25, 24, 22, 23],
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Stock levels, low-stock alerts, inventory value and turnover rate.",
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    metric: "₦2.1M",
    prevMetric: "₦1.97M",
    metricLabel: "Stock value",
    change: 6.8,
    sparkline: [55, 62, 58, 71, 68, 74, 80],
  },
]

const SCHEDULE_FREQS: ScheduleFreq[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "off", label: "Off" },
]

const PREVIEW_DATA: Record<ReportType, { headers: string[]; rows: (string | number)[][] }> = {
  revenue: {
    headers: ["Date", "Orders", "Gross Revenue", "Refunds", "Net Revenue"],
    rows: [
      ["May 1–7", 28, "₦78,500", "₦3,200", "₦75,300"],
      ["Apr 24–30", 34, "₦89,200", "₦1,500", "₦87,700"],
      ["Apr 17–23", 31, "₦71,400", "₦2,800", "₦68,600"],
      ["Apr 10–16", 22, "₦54,800", "₦0", "₦54,800"],
      ["Apr 3–9", 19, "₦46,100", "₦900", "₦45,200"],
    ],
  },
  orders: {
    headers: ["Week", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"],
    rows: [
      ["May 1–7", 4, 3, 5, 16, 0],
      ["Apr 24–30", 2, 5, 8, 19, 1],
      ["Apr 17–23", 3, 2, 6, 20, 1],
      ["Apr 10–16", 1, 4, 4, 13, 0],
      ["Apr 3–9", 2, 1, 3, 13, 1],
    ],
  },
  customers: {
    headers: ["Month", "New", "Returning", "VIP", "At Risk", "WhatsApp %"],
    rows: [
      ["May 2026", 23, 66, 14, 4, "78%"],
      ["Apr 2026", 18, 71, 12, 6, "74%"],
      ["Mar 2026", 31, 58, 10, 8, "70%"],
      ["Feb 2026", 15, 64, 9, 5, "68%"],
      ["Jan 2026", 22, 54, 8, 7, "65%"],
    ],
  },
  products: {
    headers: ["Product", "Category", "Units Sold", "Revenue", "Avg Rating"],
    rows: [
      ["Ankara Print Dress", "Fashion", 42, "₦777,000", "4.9"],
      ["Beaded Necklace Set", "Jewellery", 31, "₦744,000", "4.8"],
      ["Leather Mini Bag", "Accessories", 27, "₦769,500", "4.7"],
      ["Perfume Collection Box", "Beauty", 24, "₦432,000", "4.9"],
      ["Embroidered Set", "Fashion", 22, "₦539,000", "4.6"],
    ],
  },
  inventory: {
    headers: ["Product", "SKU", "Stock", "Status", "Inv. Value"],
    rows: [
      ["Ankara Print Dress", "APD-001", 12, "Low stock", "₦222,000"],
      ["Beaded Necklace Set", "BNS-002", 0, "Out of stock", "₦0"],
      ["Leather Mini Bag", "LMB-003", 45, "In stock", "₦1,282,500"],
      ["Perfume Collection Box", "PCB-004", 8, "Low stock", "₦144,000"],
      ["Silk Blouse", "SBL-005", 23, "In stock", "₦391,000"],
    ],
  },
}

const AI_INSIGHTS: Record<ReportType, AIInsight[]> = {
  revenue: [
    { type: "success", title: "Best week on record", body: "Apr 24–30 generated ₦87,700 net — your highest week this quarter. Ankara Print Dress drove 38% of it." },
    { type: "tip", title: "Reduce refund rate", body: "Your refund rate is 3.8%. Adding size guides to fashion listings typically cuts returns by 40–60%." },
    { type: "warning", title: "Mid-month dip", body: "Revenue consistently drops in weeks 2–3. Consider running a flash sale around Apr 17 to smooth the curve." },
  ],
  orders: [
    { type: "success", title: "Zero cancellations this week", body: "May 1–7 had no cancelled orders — a first in 6 weeks. Your updated shipping policy is working." },
    { type: "tip", title: "Upsell on confirmation", body: "Customers who receive order confirmation messages are 2.3× more likely to reorder within 30 days. Set up WhatsApp follow-ups." },
    { type: "warning", title: "Processing backlog", body: "5 orders are still in 'Processing' from Apr 24–30. Aim to ship within 48 hours to maintain your 4.8★ rating." },
  ],
  customers: [
    { type: "success", title: "78% WhatsApp conversion", body: "Nearly 4 in 5 new customers placed orders through WhatsApp — up from 65% in January." },
    { type: "tip", title: "Re-engage at-risk customers", body: "4 VIP customers haven't ordered in 45+ days. A personal WhatsApp message with 10% off typically wins 60% back." },
    { type: "warning", title: "Lagos concentration risk", body: "73% of customers are in Lagos. Running targeted campaigns in Abuja and PH could diversify your base." },
  ],
  products: [
    { type: "success", title: "Top 5 drive 81% of revenue", body: "Your Ankara Print Dress alone accounts for ₦777K. Restock immediately — you have 12 left." },
    { type: "tip", title: "Bundle opportunity", body: "Customers who buy the Beaded Necklace Set often view the Embroidered Set. A bundle discount could increase AOV by ₦8,500." },
    { type: "warning", title: "Perfume Collection low stock", body: "Only 8 units left with 24 units sold this period. You'll sell out in ~5 days at current velocity." },
  ],
  inventory: [
    { type: "warning", title: "Beaded Necklace Set: URGENT", body: "0 units in stock but it's your #2 seller by revenue. Every day without stock costs ~₦24,000 in lost sales." },
    { type: "tip", title: "Reorder point alert", body: "Set reorder alerts for items below 10 units. Your current low-stock items (APD-001, PCB-004) need restocking within 3 days." },
    { type: "success", title: "Leather Mini Bag well stocked", body: "45 units on hand at your current sell-through rate (27/mo) gives you 50+ days of runway." },
  ],
}

// Mini sparkline SVG
function Sparkline({ data, color, height = 28 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 64
  const h = height
  const step = w / (data.length - 1)

  const points = data.map((v, i) => {
    const x = i * step
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(" ")

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="opacity-80">
      <polyline points={points} stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      {/* End dot */}
      <circle
        cx={data.length > 0 ? (data.length - 1) * step : 0}
        cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2}
        r="2.5"
        fill={color}
      />
    </svg>
  )
}

// Full bar chart for active report
function ReportBarChart({ data, color }: { data: { label: string; value: number; prev: number }[]; color: string }) {
  const max = Math.max(...data.flatMap(d => [d.value, d.prev]))
  const W = 480
  const H = 120
  const barW = 16
  const gap = 8
  const groupW = barW * 2 + gap + 16
  const totalGroupW = groupW * data.length
  const offsetX = (W - totalGroupW) / 2

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 24}`} className="overflow-visible">
      {data.map((d, i) => {
        const x = offsetX + i * groupW
        const prevH = (d.prev / max) * H
        const curH = (d.value / max) * H
        return (
          <g key={i}>
            {/* Previous bar */}
            <rect x={x} y={H - prevH} width={barW} height={prevH} rx="3" fill={color} opacity="0.22" />
            {/* Current bar */}
            <rect x={x + barW + gap} y={H - curH} width={barW} height={curH} rx="3" fill={color} />
            {/* Label */}
            <text x={x + barW + gap / 2} y={H + 16} textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.5">
              {d.label}
            </text>
          </g>
        )
      })}
      {/* Zero line */}
      <line x1={offsetX - 4} y1={H} x2={W - offsetX + 4} y2={H} stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
    </svg>
  )
}

const CHART_DATA: Record<ReportType, { label: string; value: number; prev: number }[]> = {
  revenue: [
    { label: "Apr 3", value: 45200, prev: 38000 },
    { label: "Apr 10", value: 54800, prev: 47000 },
    { label: "Apr 17", value: 68600, prev: 60000 },
    { label: "Apr 24", value: 87700, prev: 74000 },
    { label: "May 1", value: 75300, prev: 64000 },
  ],
  orders: [
    { label: "Apr 3", value: 19, prev: 15 },
    { label: "Apr 10", value: 22, prev: 18 },
    { label: "Apr 17", value: 31, prev: 27 },
    { label: "Apr 24", value: 34, prev: 30 },
    { label: "May 1", value: 28, prev: 24 },
  ],
  customers: [
    { label: "Jan", value: 22, prev: 17 },
    { label: "Feb", value: 15, prev: 14 },
    { label: "Mar", value: 31, prev: 23 },
    { label: "Apr", value: 18, prev: 16 },
    { label: "May", value: 23, prev: 12 },
  ],
  products: [
    { label: "Ankara", value: 42, prev: 38 },
    { label: "Beaded", value: 31, prev: 29 },
    { label: "Mini Bag", value: 27, prev: 25 },
    { label: "Perfume", value: 24, prev: 20 },
    { label: "Emb. Set", value: 22, prev: 18 },
  ],
  inventory: [
    { label: "Ankara", value: 12, prev: 38 },
    { label: "Beaded", value: 0, prev: 24 },
    { label: "Mini Bag", value: 45, prev: 52 },
    { label: "Perfume", value: 8, prev: 20 },
    { label: "Silk", value: 23, prev: 28 },
  ],
}

const ACCENT_HEX: Record<ReportType, string> = {
  revenue: "#6C4EF3",
  orders: "#10B981",
  customers: "#F59E0B",
  products: "#F97316",
  inventory: "#3B82F6",
}

function downloadCSV(report: Report, range: DateRange, data: { headers: string[]; rows: (string | number)[][] }) {
  const rangeLabel = DATE_RANGES.find((d) => d.id === range)?.label ?? range
  const content = [data.headers, ...data.rows].map((row) => row.join(",")).join("\n")
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `lummy-${report.id}-${rangeLabel.replace(/\s+/g, "-").toLowerCase()}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast({ title: "CSV exported", description: `${report.label} downloaded.`, variant: "success" })
}

export default function ReportsPage() {
  const [activeRange, setActiveRange] = React.useState<DateRange>("this_month")
  const [activeReport, setActiveReport] = React.useState<ReportType>("revenue")
  const [scheduleFreqs, setScheduleFreqs] = React.useState<Record<ReportType, string>>({
    revenue: "weekly", orders: "weekly", customers: "monthly", products: "off", inventory: "off",
  })
  const [showSchedule, setShowSchedule] = React.useState(false)
  const [showInsights, setShowInsights] = React.useState(true)
  const [rangeDropdown, setRangeDropdown] = React.useState(false)
  const [dismissedInsights, setDismissedInsights] = React.useState<Set<string>>(new Set())
  const [showCustomRange, setShowCustomRange] = React.useState(false)
  const [customFrom, setCustomFrom] = React.useState("")
  const [customTo, setCustomTo] = React.useState("")

  const currentReport = REPORTS.find((r) => r.id === activeReport)!
  const previewData = PREVIEW_DATA[activeReport]
  const currentRange = DATE_RANGES.find((d) => d.id === activeRange)!
  const chartData = CHART_DATA[activeReport]
  const insights = AI_INSIGHTS[activeReport].filter(ins => !dismissedInsights.has(`${activeReport}-${ins.title}`))
  const accentHex = ACCENT_HEX[activeReport]

  const handleScheduleChange = (reportId: ReportType, freq: string) => {
    setScheduleFreqs((prev) => ({ ...prev, [reportId]: freq }))
    if (freq !== "off") {
      toast({ title: "Schedule updated", description: `${REPORTS.find((r) => r.id === reportId)?.label} will be emailed ${freq}.`, variant: "success" })
    }
  }

  const dismissInsight = (title: string) => {
    setDismissedInsights(prev => { const next = new Set(prev); next.add(`${activeReport}-${title}`); return next })
  }

  const isUp = currentReport.change >= 0

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Analytics and scheduled exports for your store</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range picker */}
          <div className="relative">
            <button
              onClick={() => setRangeDropdown(v => !v)}
              className="flex items-center gap-2 h-9 px-3 rounded-xl border border-border bg-card text-sm font-medium hover:bg-accent transition-colors"
            >
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {activeRange === "custom" && customFrom && customTo
                ? `${customFrom} – ${customTo}`
                : currentRange.label}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <AnimatePresence>
              {rangeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 z-30 min-w-[180px] rounded-xl border border-border bg-card shadow-lg overflow-hidden"
                >
                  {DATE_RANGES.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => {
                        setActiveRange(range.id)
                        setRangeDropdown(false)
                        if (range.id === "custom") setShowCustomRange(true)
                      }}
                      className={cn(
                        "flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-accent transition-colors",
                        activeRange === range.id ? "text-brand-purple font-semibold" : ""
                      )}
                    >
                      {range.label}
                      {activeRange === range.id && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button size="sm" variant="outline" className="gap-1.5 h-9" onClick={() => setShowSchedule(v => !v)}>
            <Mail className="h-3.5 w-3.5" /> Schedule
          </Button>

          <Button
            size="sm"
            variant="outline"
            className={cn("gap-1.5 h-9", showInsights && "bg-brand-purple/10 border-brand-purple/30 text-brand-purple")}
            onClick={() => setShowInsights(v => !v)}
          >
            <Sparkles className="h-3.5 w-3.5" /> Insights
          </Button>
        </div>
      </div>

      {/* Custom range picker */}
      <AnimatePresence>
        {showCustomRange && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="h-8 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-1 focus:ring-brand-purple"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="h-8 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-1 focus:ring-brand-purple"
                />
              </div>
              <Button
                size="sm"
                className="h-8 bg-brand-purple hover:bg-brand-purple/90 text-white"
                onClick={() => {
                  if (customFrom && customTo) {
                    setShowCustomRange(false)
                    toast({ title: "Date range applied", description: `Showing data from ${customFrom} to ${customTo}.`, variant: "success" })
                  }
                }}
              >Apply</Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setShowCustomRange(false); setActiveRange("this_month") }}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {REPORTS.map((report, i) => {
          const isActive = activeReport === report.id
          const Icon = report.icon
          const up = report.change >= 0
          const hex = ACCENT_HEX[report.id]
          return (
            <motion.button
              key={report.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setActiveReport(report.id)}
              className={cn(
                "rounded-2xl border p-3.5 text-left transition-all duration-200 cursor-pointer",
                isActive
                  ? `${report.bg} ${report.border} ring-1 ring-inset ring-current/20`
                  : "border-border bg-card hover:border-foreground/10 hover:bg-accent/50"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", report.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", report.color)} />
                </div>
                <Sparkline data={report.sparkline} color={hex} />
              </div>
              <p className="text-xs font-bold leading-tight mb-0.5">{report.label}</p>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="font-display text-base font-extrabold">{report.metric}</span>
                <span className={cn("flex items-center text-[10px] font-semibold", up ? "text-brand-green" : "text-brand-coral")}>
                  {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(report.change)}%
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">{report.metricLabel}</p>
            </motion.button>
          )
        })}
      </div>

      {/* Main content: chart + insights side by side on wide screens */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Chart + table — takes 2/3 */}
        <div className="xl:col-span-2 space-y-4">
          {/* KPI comparison row */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeReport + "-kpi"}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                {
                  label: "Current period",
                  value: currentReport.metric,
                  sub: currentRange.label,
                  emphasis: true,
                },
                {
                  label: "Previous period",
                  value: currentReport.prevMetric,
                  sub: "vs prior",
                  emphasis: false,
                },
                {
                  label: "Change",
                  value: `${isUp ? "+" : ""}${currentReport.change}%`,
                  sub: isUp ? "Growth" : "Decline",
                  up: isUp,
                  isChange: true,
                },
              ].map((kpi, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-2xl border p-4",
                    kpi.emphasis ? "bg-card border-border" : "bg-muted/30 border-border"
                  )}
                >
                  <p className="text-[10px] text-muted-foreground mb-1 font-medium">{kpi.label}</p>
                  <p className={cn(
                    "font-display text-xl font-extrabold",
                    "isChange" in kpi && kpi.isChange
                      ? kpi.up ? "text-brand-green" : "text-brand-coral"
                      : "text-foreground"
                  )}>
                    {"isChange" in kpi && kpi.isChange ? (
                      <span className="flex items-center gap-0.5">
                        {kpi.up ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                        {kpi.value}
                      </span>
                    ) : kpi.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Bar chart */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeReport + "-chart"}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold">{currentReport.label} over time</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{currentRange.label}</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accentHex, opacity: 0.25 }} />
                    Previous
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accentHex }} />
                    Current
                  </span>
                </div>
              </div>
              <div className="h-36 flex items-end" style={{ color: accentHex }}>
                <ReportBarChart data={chartData} color={accentHex} />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Preview table */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeReport}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", currentReport.bg)}>
                    <currentReport.icon className={cn("h-3.5 w-3.5", currentReport.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{currentReport.label} Report</p>
                    <p className="text-[10px] text-muted-foreground">{currentRange.label} · {previewData.rows.length} rows preview</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
                    onClick={() => downloadCSV(currentReport, activeRange, previewData)}>
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
                    onClick={() => toast({ title: "PDF export", description: "PDF generation coming soon.", variant: "default" })}>
                    <FileText className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {previewData.headers.map((header) => (
                        <th key={header} className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewData.rows.map((row, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-accent/30 transition-colors"
                      >
                        {row.map((cell, j) => (
                          <td key={j} className={cn(
                            "px-5 py-3 whitespace-nowrap",
                            j === 0 ? "font-medium text-sm" : "text-sm text-muted-foreground",
                            typeof cell === "string" && cell.startsWith("₦") ? "font-semibold text-foreground" : "",
                            cell === "Out of stock" ? "text-brand-coral font-semibold" : "",
                            cell === "Low stock" ? "text-amber-500 font-semibold" : "",
                            cell === "In stock" ? "text-brand-green font-semibold" : "",
                          )}>
                            {cell}
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Showing preview — download CSV for full data</p>
                <Button size="sm" variant="ghost" className="gap-1.5 h-7 text-xs text-muted-foreground"
                  onClick={() => toast({ title: "Refreshed", description: "Data is up to date.", variant: "success" })}>
                  <RefreshCw className="h-3 w-3" /> Refresh
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right sidebar: AI insights + quick stats */}
        <div className="space-y-4">
          {/* AI Insights panel */}
          <AnimatePresence>
            {showInsights && (
              <motion.div
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-brand-purple/10">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-brand-purple" />
                    <p className="text-sm font-bold text-brand-purple">AI Insights</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-brand-purple/10 px-2 py-0.5 rounded-full font-medium">
                    {currentReport.label}
                  </span>
                </div>

                <div className="p-3 space-y-2">
                  <AnimatePresence>
                    {insights.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground text-center py-4">All insights reviewed</p>
                    ) : (
                      insights.map((ins) => (
                        <motion.div
                          key={ins.title}
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className={cn(
                            "rounded-xl border p-3 relative",
                            ins.type === "success" && "bg-brand-green/5 border-brand-green/20",
                            ins.type === "warning" && "bg-amber-500/5 border-amber-500/20",
                            ins.type === "tip" && "bg-brand-purple/5 border-brand-purple/15",
                          )}
                        >
                          <button
                            onClick={() => dismissInsight(ins.title)}
                            className="absolute top-2 right-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="flex items-start gap-2 pr-4">
                            {ins.type === "success" && <TrendingUp className="h-3.5 w-3.5 text-brand-green flex-shrink-0 mt-0.5" />}
                            {ins.type === "warning" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />}
                            {ins.type === "tip" && <Lightbulb className="h-3.5 w-3.5 text-brand-purple flex-shrink-0 mt-0.5" />}
                            <div>
                              <p className="text-[11px] font-bold mb-0.5">{ins.title}</p>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">{ins.body}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick summary cards */}
          <div className="space-y-2.5">
            {[
              { label: "Last export", value: "Revenue Report", sub: "3 days ago · CSV", icon: Download, color: "text-brand-purple" },
              { label: "Scheduled reports", value: `${Object.values(scheduleFreqs).filter(f => f !== "off").length} active`, sub: "Reports with schedule", icon: Mail, color: "text-brand-green" },
              { label: "Data freshness", value: "Live", sub: "Updated every 15 min", icon: RefreshCw, color: "text-amber-500" },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="rounded-2xl border border-border bg-card p-3.5 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <card.icon className={cn("h-3.5 w-3.5", card.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">{card.label}</p>
                  <p className="text-sm font-bold truncate">{card.value}</p>
                  <p className="text-[10px] text-muted-foreground">{card.sub}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0 ml-auto" />
              </motion.div>
            ))}
          </div>

          {/* Info box */}
          <div className="rounded-2xl border border-border bg-muted/20 p-4 flex items-start gap-2.5">
            <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Reports reflect confirmed and completed orders only. Pending orders are excluded from revenue calculations.
            </p>
          </div>
        </div>
      </div>

      {/* Schedule panel */}
      <AnimatePresence>
        {showSchedule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-brand-purple" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Email Schedule</p>
                    <p className="text-xs text-muted-foreground">Get reports delivered to your inbox automatically</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> Sends at 08:00 WAT
                </div>
              </div>

              <div className="space-y-1">
                {REPORTS.map((report) => {
                  const Icon = report.icon
                  const freq = scheduleFreqs[report.id]
                  return (
                    <div key={report.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", report.bg)}>
                          <Icon className={cn("h-3.5 w-3.5", report.color)} />
                        </div>
                        <p className="text-sm font-medium">{report.label}</p>
                      </div>
                      <div className="flex gap-1">
                        {SCHEDULE_FREQS.map((sf) => (
                          <button
                            key={sf.id}
                            onClick={() => handleScheduleChange(report.id, sf.id)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all",
                              freq === sf.id
                                ? sf.id === "off"
                                  ? "bg-muted border-border text-muted-foreground"
                                  : "bg-brand-purple text-white border-brand-purple"
                                : "border-border text-muted-foreground hover:border-foreground/20"
                            )}
                          >
                            {sf.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-xl bg-muted/40 border border-border p-3 flex items-start gap-2.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-purple flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Reports are sent to your registered email address. You can update your email in{" "}
                  <a href="/dashboard/settings" className="text-brand-purple hover:underline font-medium">Settings</a>.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
