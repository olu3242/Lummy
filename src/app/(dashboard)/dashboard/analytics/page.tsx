"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Eye,
  MessageCircle,
  Users,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from "lucide-react"
import { cn } from "@/lib/utils"

const revenueData = [
  { month: "Jan", revenue: 285000, orders: 42, views: 1820 },
  { month: "Feb", revenue: 312000, orders: 51, views: 2100 },
  { month: "Mar", revenue: 298000, orders: 48, views: 1950 },
  { month: "Apr", revenue: 425000, orders: 67, views: 2840 },
  { month: "May", revenue: 389000, orders: 58, views: 2600 },
  { month: "Jun", revenue: 467000, orders: 74, views: 3200 },
  { month: "Jul", revenue: 512000, orders: 82, views: 3750 },
  { month: "Aug", revenue: 448000, orders: 70, views: 3100 },
  { month: "Sep", revenue: 534000, orders: 88, views: 4020 },
  { month: "Oct", revenue: 591000, orders: 94, views: 4380 },
  { month: "Nov", revenue: 623000, orders: 99, views: 4700 },
  { month: "Dec", revenue: 718000, orders: 112, views: 5240 },
]

const weeklyConversionData = [
  { day: "Mon", views: 312, clicks: 87, orders: 14 },
  { day: "Tue", views: 280, clicks: 72, orders: 11 },
  { day: "Wed", views: 398, clicks: 118, orders: 19 },
  { day: "Thu", views: 425, clicks: 134, orders: 22 },
  { day: "Fri", views: 512, clicks: 167, orders: 28 },
  { day: "Sat", views: 634, clicks: 201, orders: 34 },
  { day: "Sun", views: 489, clicks: 152, orders: 25 },
]

const trafficSourceData = [
  { name: "WhatsApp", value: 58, color: "#25D366" },
  { name: "Direct Link", value: 24, color: "#6C4EF3" },
  { name: "Instagram", value: 11, color: "#E1306C" },
  { name: "TikTok", value: 7, color: "#010101" },
]

const topProductsData = [
  { name: "Ankara Print Dress", views: 1842, orders: 89, revenue: 890000, growth: 23 },
  { name: "Beaded Necklace Set", views: 1234, orders: 67, revenue: 603000, growth: 15 },
  { name: "Leather Mini Bag", views: 987, orders: 45, revenue: 675000, growth: -4 },
  { name: "Embroidered Set", views: 876, orders: 38, revenue: 570000, growth: 31 },
  { name: "Gold Hoop Earrings", views: 743, orders: 52, revenue: 364000, growth: 8 },
  { name: "Silk Blouse", views: 612, orders: 29, revenue: 261000, growth: -11 },
]

const kpiStats = [
  { label: "Total Revenue", value: "₦5.1M", change: "+18%", up: true, icon: TrendingUp, color: "text-brand-purple" },
  { label: "Total Orders", value: "885", change: "+24%", up: true, icon: ShoppingBag, color: "text-brand-green" },
  { label: "Store Views", value: "39.7K", change: "+31%", up: true, icon: Eye, color: "text-brand-coral" },
  { label: "Conversion Rate", value: "2.23%", change: "-0.3%", up: false, icon: MessageCircle, color: "text-amber-500" },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm px-3 py-2.5 text-xs shadow-lg">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-20 text-muted-foreground capitalize">{p.dataKey}:</span>
          <span className="font-semibold">
            {p.dataKey === "revenue" ? `₦${Number(p.value).toLocaleString()}` : p.value.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [revPeriod, setRevPeriod] = React.useState<"3m" | "6m" | "12m">("12m")

  const revSlice = revPeriod === "3m" ? revenueData.slice(-3) : revPeriod === "6m" ? revenueData.slice(-6) : revenueData

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track your store performance and growth</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
            </div>
            <p className="font-display text-xl font-extrabold">{stat.value}</p>
            <div className={cn("flex items-center gap-1 mt-1.5 text-xs font-semibold", stat.up ? "text-brand-green" : "text-brand-coral")}>
              {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {stat.change} vs last year
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-base">Revenue over time</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly revenue in Naira</p>
          </div>
          <div className="flex gap-1">
            {(["3m", "6m", "12m"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setRevPeriod(p)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                  revPeriod === p ? "bg-brand-purple text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revSlice} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C4EF3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C4EF3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#6C4EF3" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#6C4EF3" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Conversion funnel + Traffic sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly conversion */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="font-display font-bold text-base mb-1">Weekly conversion</h2>
          <p className="text-xs text-muted-foreground mb-4">Views → Clicks → Orders</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyConversionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="views" fill="#6C4EF3" fillOpacity={0.2} radius={[3, 3, 0, 0]} />
                <Bar dataKey="clicks" fill="#6C4EF3" fillOpacity={0.5} radius={[3, 3, 0, 0]} />
                <Bar dataKey="orders" fill="#6C4EF3" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Traffic sources */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="font-display font-bold text-base mb-1">Traffic sources</h2>
          <p className="text-xs text-muted-foreground mb-4">Where your customers come from</p>
          <div className="flex items-center gap-4">
            <div className="h-48 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {trafficSourceData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5 flex-shrink-0">
              {trafficSourceData.map((src) => (
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

      {/* Top products performance table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="p-5 border-b border-border">
          <h2 className="font-display font-bold text-base">Product performance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">This year vs last year</p>
        </div>

        <div className="hidden sm:grid grid-cols-[1fr_80px_80px_120px_80px] gap-4 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
          <span>Product</span>
          <span>Views</span>
          <span>Orders</span>
          <span>Revenue</span>
          <span>Growth</span>
        </div>

        <div className="divide-y divide-border">
          {topProductsData.map((product, i) => (
            <div
              key={product.name}
              className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_120px_80px] gap-2 sm:gap-4 px-5 py-3.5 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-purple/10 flex items-center justify-center text-[10px] font-bold text-brand-purple flex-shrink-0">
                  {i + 1}
                </div>
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
    </div>
  )
}
