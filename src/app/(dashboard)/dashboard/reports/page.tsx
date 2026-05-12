"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3, Download, FileText, TrendingUp, Users, ShoppingBag,
  Package, Calendar, ChevronDown, Check, ArrowUpRight, ArrowDownRight,
  RefreshCw, Mail, Clock, Star, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type DateRange = "this_week" | "this_month" | "last_month" | "last_3_months"
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
}

interface ScheduleFreq { id: string; label: string }

const DATE_RANGES: { id: DateRange; label: string }[] = [
  { id: "this_week", label: "This week" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "last_3_months", label: "Last 3 months" },
]

const REPORTS: Report[] = [
  {
    id: "revenue",
    label: "Revenue Summary",
    description: "Total revenue, average order value, refunds and net income breakdown.",
    icon: TrendingUp,
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
    border: "border-brand-purple/20",
    metric: "₦312,500",
    metricLabel: "Net revenue",
    change: 18.4,
  },
  {
    id: "orders",
    label: "Orders Report",
    description: "Order volume by status, delivery performance and fulfilment rate.",
    icon: ShoppingBag,
    color: "text-brand-green",
    bg: "bg-brand-green/10",
    border: "border-brand-green/20",
    metric: "147",
    metricLabel: "Total orders",
    change: 11.2,
  },
  {
    id: "customers",
    label: "Customer Acquisition",
    description: "New vs returning customers, top locations, WhatsApp engagement rate.",
    icon: Users,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    metric: "89",
    metricLabel: "New customers",
    change: 24.7,
  },
  {
    id: "products",
    label: "Top Products",
    description: "Best-selling products by revenue and units sold, category breakdown.",
    icon: Star,
    color: "text-brand-coral",
    bg: "bg-brand-coral/10",
    border: "border-brand-coral/20",
    metric: "23",
    metricLabel: "Active listings",
    change: -3.1,
  },
  {
    id: "inventory",
    label: "Inventory Snapshot",
    description: "Stock levels, low-stock alerts, inventory value and turnover rate.",
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    metric: "₦2.1M",
    metricLabel: "Stock value",
    change: 6.8,
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
  const [rangeDropdown, setRangeDropdown] = React.useState(false)

  const currentReport = REPORTS.find((r) => r.id === activeReport)!
  const previewData = PREVIEW_DATA[activeReport]
  const currentRange = DATE_RANGES.find((d) => d.id === activeRange)!

  const handleScheduleChange = (reportId: ReportType, freq: string) => {
    setScheduleFreqs((prev) => ({ ...prev, [reportId]: freq }))
    if (freq !== "off") {
      toast({ title: "Schedule updated", description: `${REPORTS.find((r) => r.id === reportId)?.label} will be emailed ${freq}.`, variant: "success" })
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Download and schedule reports for your store</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range picker */}
          <div className="relative">
            <button onClick={() => setRangeDropdown(v => !v)}
              className="flex items-center gap-2 h-9 px-3 rounded-xl border border-border bg-card text-sm font-medium hover:bg-accent transition-colors">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {currentRange.label}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <AnimatePresence>
              {rangeDropdown && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 z-30 min-w-[160px] rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                  {DATE_RANGES.map((range) => (
                    <button key={range.id} onClick={() => { setActiveRange(range.id); setRangeDropdown(false) }}
                      className={cn("flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-accent transition-colors",
                        activeRange === range.id ? "text-brand-purple font-semibold" : "")}>
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
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {REPORTS.map((report, i) => {
          const isActive = activeReport === report.id
          const Icon = report.icon
          const isUp = report.change >= 0
          return (
            <motion.button key={report.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setActiveReport(report.id)}
              className={cn("rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer",
                isActive
                  ? `${report.bg} ${report.border}`
                  : "border-border bg-card hover:border-foreground/10 hover:bg-accent/50"
              )}>
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-3", report.bg)}>
                <Icon className={cn("h-4 w-4", report.color)} />
              </div>
              <p className="text-sm font-bold leading-tight mb-0.5">{report.label}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="font-display text-lg font-extrabold">{report.metric}</span>
                <span className={cn("flex items-center text-[10px] font-semibold", isUp ? "text-brand-green" : "text-brand-coral")}>
                  {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(report.change)}%
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">{report.metricLabel}</p>
            </motion.button>
          )
        })}
      </div>

      {/* Preview table */}
      <AnimatePresence mode="wait">
        <motion.div key={activeReport} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Table header row */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", currentReport.bg)}>
                <currentReport.icon className={cn("h-3.5 w-3.5", currentReport.color)} />
              </div>
              <div>
                <p className="text-sm font-bold">{currentReport.label}</p>
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
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }} className="hover:bg-accent/30 transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className={cn("px-5 py-3 whitespace-nowrap",
                        j === 0 ? "font-medium text-sm" : "text-sm text-muted-foreground",
                        typeof cell === "string" && cell.startsWith("₦") ? "font-semibold text-foreground" : "",
                        cell === "Out of stock" ? "text-brand-coral" : "",
                        cell === "Low stock" ? "text-amber-500" : "",
                        cell === "In stock" ? "text-brand-green" : "",
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

      {/* Schedule panel */}
      <AnimatePresence>
        {showSchedule && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
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

              <div className="space-y-2">
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
                          <button key={sf.id} onClick={() => handleScheduleChange(report.id, sf.id)}
                            className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all",
                              freq === sf.id
                                ? sf.id === "off"
                                  ? "bg-muted border-border text-muted-foreground"
                                  : "bg-brand-purple text-white border-brand-purple"
                                : "border-border text-muted-foreground hover:border-foreground/20")}>
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

      {/* Quick summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Last export", value: "Revenue Report", sub: "3 days ago · CSV", icon: Download, color: "text-brand-purple" },
          { label: "Scheduled reports", value: `${Object.values(scheduleFreqs).filter((f) => f !== "off").length} active`, sub: "Reports with schedule", icon: Mail, color: "text-brand-green" },
          { label: "Data freshness", value: "Live", sub: "Updated every 15 min", icon: RefreshCw, color: "text-amber-500" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <card.icon className={cn("h-4 w-4", card.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">{card.label}</p>
              <p className="text-sm font-bold truncate">{card.value}</p>
              <p className="text-[10px] text-muted-foreground">{card.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
