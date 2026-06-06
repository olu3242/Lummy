"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Target, TrendingUp, ShoppingBag, Users, Star,
  Zap, Crown, Trophy, Lock, CheckCircle2, Flame,
  Edit2, X, Sparkles, BarChart3,
  MessageCircle, ArrowRight, Bot, Plus,
  Share2, ChevronRight, ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const GOALS_KEY    = "lummy_goals_targets"
const FREEZE_KEY   = "lummy_streak_frozen"
const CUSTOM_KEY   = "lummy_custom_goals"

interface GoalTarget {
  id: string
  label: string
  icon: React.ElementType
  current: number
  target: number
  unit: string
  prefix?: string
  color: string
  bg: string
  border: string
  tip: string
  lastMonth?: number
}

interface CustomGoal {
  id: string
  label: string
  current: number
  target: number
  prefix: string
  unit: string
}

interface Milestone {
  id: string
  icon: React.ElementType
  title: string
  desc: string
  reward: string
  threshold: number
  metric: "revenue" | "orders" | "customers" | "products"
  unlocked: boolean
  unlockedAt?: string
}

const DEFAULT_TARGETS = {
  revenue: 500000,
  orders: 200,
  customers: 150,
  products: 30,
}

const CURRENT_VALUES = {
  revenue: 312500,
  orders: 147,
  customers: 89,
  products: 23,
}

const LAST_MONTH_VALUES = {
  revenue: 280000,
  orders: 121,
  customers: 74,
  products: 18,
}

// 7-day weekly breakdown for each metric (Mon–Sun, values as % of daily target)
const WEEKLY_DATA: Record<string, number[]> = {
  revenue:   [38000, 52000, 41000, 61000, 48000, 55000, 17500],
  orders:    [18, 24, 21, 27, 22, 20, 15],
  customers: [10, 14, 12, 15, 13, 12, 13],
  products:  [2, 3, 2, 3, 2, 3, 8],
}

const AI_TIPS: Record<string, string[]> = {
  revenue: [
    "You're 63% to your revenue goal! Try a flash sale this weekend — creators who run 24-hour promos see 40% more revenue.",
    "Promote your top 3 products on WhatsApp status daily. Creators who do this earn 2× more in the same period.",
    "Bundle 2-3 products at a slight discount. Bundles increase average order value by 35%.",
  ],
  orders: [
    "Broadcast your restock to all previous customers — 68% of them will consider reordering within 7 days.",
    "Add a time-limited discount code to your link-in-bio. Scarcity drives urgency and clicks.",
    "Reply to all WhatsApp inquiries within 1 hour. Faster replies increase conversion by 45%.",
  ],
  customers: [
    "You need 61 more customers this month! Encourage existing customers to refer a friend with a $5 credit reward.",
    "Post behind-the-scenes content 3× a week. Authenticity builds trust and attracts new buyers.",
    "Respond to every Instagram comment with your WhatsApp link. It converts at 22% when personalized.",
  ],
  products: [
    "Add 7 more products to hit your goal. Focus on your best-selling category — yours is Clothing at 52% of sales.",
    "Restock your top 3 out-of-stock items. Waiting lists create instant demand.",
  ],
}

function loadTargets(): typeof DEFAULT_TARGETS {
  if (typeof window === "undefined") return DEFAULT_TARGETS
  try {
    const raw = localStorage.getItem(GOALS_KEY)
    return raw ? { ...DEFAULT_TARGETS, ...JSON.parse(raw) } : DEFAULT_TARGETS
  } catch { return DEFAULT_TARGETS }
}

function saveTargets(t: typeof DEFAULT_TARGETS) {
  try { localStorage.setItem(GOALS_KEY, JSON.stringify(t)) } catch {}
}

function loadCustomGoals(): CustomGoal[] {
  if (typeof window === "undefined") return []
  try { const r = localStorage.getItem(CUSTOM_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}

function saveCustomGoals(goals: CustomGoal[]) {
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(goals)) } catch {}
}

function loadFrozen(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(FREEZE_KEY) === "1"
}

function RadialProgress({ pct, color, size = 80, stroke = 7 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(pct / 100, 1))

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        strokeWidth={stroke} className="stroke-muted" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        strokeWidth={stroke} stroke={color}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
      />
    </svg>
  )
}

/** Pace chip showing projected end-of-month value */
function PaceChip({ current, target, prefix, unit }: { current: number; target: number; prefix?: string; unit: string }) {
  const today = 12
  const daysInMonth = 31
  const dailyRate = current / today
  const projected = Math.round(dailyRate * daysInMonth)
  const onTrack = projected >= target

  return (
    <div className={cn(
      "flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
      onTrack ? "bg-brand-green/10 text-brand-green border border-brand-green/20"
              : "bg-brand-coral/10 text-brand-coral border border-brand-coral/20"
    )}>
      {onTrack ? "📈" : "⚠️"}
      Projected: {prefix}{projected.toLocaleString()}{unit}
    </div>
  )
}

/** Next unlocked milestone chip for a given metric */
function NextMilestoneChip({ metric, current }: { metric: string; current: number }) {
  const next = MILESTONES_DATA.filter(m => m.metric === metric && !m.unlocked)
    .sort((a, b) => a.threshold - b.threshold)[0]

  if (!next) return null

  const pct = Math.min(Math.round((current / next.threshold) * 100), 100)

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <next.icon className="h-3 w-3 text-amber-500 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <span>{next.title}</span>
          <span className="font-semibold text-foreground">{pct}%</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <motion.div className="h-full bg-amber-500 rounded-full"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }} />
        </div>
      </div>
    </div>
  )
}

function GoalCard({ goal, onEdit }: { goal: GoalTarget; onEdit: () => void }) {
  const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100)
  const remaining = goal.target - goal.current
  const done = pct >= 100
  const isWarning = pct >= 80 && !done

  const colorMap: Record<string, string> = {
    "text-brand-purple": "#6C4EF3",
    "text-brand-green":  "#10B981",
    "text-brand-coral":  "#F97316",
    "text-amber-500":    "#F59E0B",
  }
  const svgColor = colorMap[goal.color] ?? "#6C4EF3"

  const vsLastMonth = goal.lastMonth != null
    ? ((goal.current - goal.lastMonth) / Math.max(goal.lastMonth, 1) * 100).toFixed(0)
    : null

  const shareOnWhatsApp = () => {
    const msg = `🎯 I'm ${pct}% toward my ${goal.label} goal on Lummy! ${goal.prefix ?? ""}${goal.current.toLocaleString()}${goal.unit} achieved. Growing every day! 🚀`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl border bg-card p-5 relative overflow-hidden", done ? "border-brand-green/30" : goal.border)}
    >
      {done && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
          className="absolute top-3 right-3">
          <CheckCircle2 className="h-5 w-5 text-brand-green" />
        </motion.div>
      )}

      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <RadialProgress pct={pct} color={svgColor} size={72} stroke={6} />
          <div className="absolute inset-0 flex items-center justify-center">
            <goal.icon className={cn("h-5 w-5", done ? "text-brand-green" : goal.color)} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-muted-foreground">{goal.label}</p>
            <div className="flex items-center gap-1">
              <button onClick={shareOnWhatsApp}
                className="p-1 rounded-lg hover:bg-muted transition-colors" title="Share milestone">
                <Share2 className="h-3 w-3 text-muted-foreground" />
              </button>
              <button onClick={onEdit} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <Edit2 className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className={cn("font-display text-2xl font-extrabold", done ? "text-brand-green" : goal.color)}>
              {pct}%
            </span>
            <span className="text-xs text-muted-foreground">of goal</span>
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            <span className="font-semibold text-foreground">
              {goal.prefix}{goal.current.toLocaleString()}{goal.unit}
            </span>
            {" / "}{goal.prefix}{goal.target.toLocaleString()}{goal.unit}
          </p>

          {!done && (
            <p className={cn("text-[10px] mt-1.5 font-medium", isWarning ? "text-brand-green" : "text-muted-foreground")}>
              {isWarning ? "🔥 Almost there! " : ""}{goal.prefix}{remaining.toLocaleString()}{goal.unit} to go
            </p>
          )}
          {done && <p className="text-[10px] mt-1.5 font-semibold text-brand-green">🎉 Goal achieved!</p>}

          {/* vs last month */}
          {vsLastMonth !== null && (
            <p className="text-[10px] mt-1 text-muted-foreground">
              vs last month:{" "}
              <span className={cn("font-semibold", Number(vsLastMonth) >= 0 ? "text-brand-green" : "text-brand-coral")}>
                {Number(vsLastMonth) >= 0 ? "+" : ""}{vsLastMonth}%
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Pace chip */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <PaceChip current={goal.current} target={goal.target} prefix={goal.prefix} unit={goal.unit} />
      </div>

      {/* Next milestone progress */}
      <div className="mt-2">
        <NextMilestoneChip metric={goal.id} current={goal.current} />
      </div>

      <div className="mt-3 p-2.5 rounded-xl bg-muted/50 border border-border text-[10px] text-muted-foreground flex items-start gap-1.5">
        <Sparkles className="h-3 w-3 flex-shrink-0 mt-0.5 text-brand-purple" />
        <span className="leading-relaxed">{goal.tip}</span>
      </div>
    </motion.div>
  )
}

function EditGoalModal({ goal, onSave, onClose }: { goal: GoalTarget; onSave: (target: number) => void; onClose: () => void }) {
  const [value, setValue] = React.useState(String(goal.target))

  const presets = [
    goal.target * 0.5, goal.target, goal.target * 1.5, goal.target * 2
  ].map(Math.round).filter((v, i, a) => a.indexOf(v) === i)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-sm bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <goal.icon className={cn("h-4 w-4", goal.color)} />
            <h3 className="font-display font-bold text-sm">Edit {goal.label} goal</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Target ({goal.unit || (goal.prefix ?? "") + "..."})</label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)} min="1"
              className="w-full h-11 px-4 rounded-xl border border-border bg-background text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand-purple/30 text-center" />
          </div>

          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick presets</p>
            <div className="grid grid-cols-2 gap-2">
              {presets.map(p => (
                <button key={p} onClick={() => setValue(String(p))}
                  className={cn("h-9 rounded-xl border text-xs font-semibold transition-all",
                    Number(value) === p ? "border-brand-purple/30 bg-brand-purple/10 text-brand-purple" : "border-border hover:bg-muted text-muted-foreground")}>
                  {goal.prefix}{p.toLocaleString()}{goal.unit}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={() => {
            const n = Number(value)
            if (!n || n < 1) { toast({ title: "Enter a valid target" }); return }
            onSave(n); onClose()
            toast({ title: "Goal updated!", description: `${goal.label} target set to ${goal.prefix ?? ""}${n.toLocaleString()}${goal.unit}` })
          }}>Save goal</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function AddCustomGoalModal({ onSave, onClose }: { onSave: (g: CustomGoal) => void; onClose: () => void }) {
  const [label, setLabel] = React.useState("")
  const [target, setTarget] = React.useState("")
  const [prefix, setPrefix] = React.useState("$")
  const [unit, setUnit] = React.useState("")

  const handleSave = () => {
    const t = Number(target)
    if (!label.trim() || !t || t < 1) { toast({ title: "Fill in all fields" }); return }
    onSave({ id: `cg-${Date.now()}`, label: label.trim(), current: 0, target: t, prefix, unit })
    onClose()
    toast({ title: "Custom goal created!", variant: "success" })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-display font-bold text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-brand-purple" /> New Custom Goal
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Goal name <span className="text-brand-coral">*</span></label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Newsletter subscribers"
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Prefix</label>
              <div className="flex gap-1">
                {["$", "#", "", "€"].map(p => (
                  <button key={p || "none"} onClick={() => setPrefix(p)}
                    className={cn("flex-1 h-8 rounded-xl border text-xs font-semibold transition-all",
                      prefix === p ? "border-brand-purple/30 bg-brand-purple/10 text-brand-purple" : "border-border hover:bg-muted")}>
                    {p || "—"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Unit (after number)</label>
              <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. subs"
                className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Target value <span className="text-brand-coral">*</span></label>
            <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. 1000" min="1"
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave}>Create Goal</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/** Weekly breakdown panel — Mon–Sun progress bars */
function WeeklyBreakdown({ goals }: { goals: GoalTarget[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  // Use revenue as the featured metric for the weekly view
  const data = WEEKLY_DATA.revenue
  const max = Math.max(...data, 1)
  const today = 0 // Mon = index 0 in this week (relative)
  const dayOfWeek = 1 // Tuesday (today in the demo — day 12, week started Mon)

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-brand-purple" /> This Week&apos;s Revenue
        <span className="text-xs text-muted-foreground font-normal ml-auto">Mon 6 – Sun 12 May</span>
      </h2>
      <div className="space-y-2">
        {data.map((v, i) => {
          const pct = (v / max) * 100
          const isPast = i < dayOfWeek
          const isToday = i === dayOfWeek
          return (
            <div key={i} className="flex items-center gap-3">
              <span className={cn("text-xs font-semibold w-7 flex-shrink-0", isToday ? "text-brand-purple" : "text-muted-foreground")}>
                {days[i]}
              </span>
              <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden relative">
                <motion.div
                  className={cn("h-full rounded-full", isToday ? "bg-brand-purple" : isPast ? "bg-brand-purple/50" : "bg-muted")}
                  initial={{ width: 0 }}
                  animate={{ width: `${isPast || isToday ? pct : 0}%` }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-semibold text-right w-16 flex-shrink-0 text-foreground">
                {isPast || isToday ? `$${(v / 1000).toFixed(0)}k` : "—"}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Week total so far</span>
        <span className="font-bold text-foreground">${(data.slice(0, dayOfWeek + 1).reduce((s, v) => s + v, 0) / 1000).toFixed(0)}k</span>
      </div>
    </div>
  )
}

const MILESTONES_DATA: Milestone[] = [
  { id: "m1",  icon: Zap,         title: "First Sale",    desc: "Make your very first sale",              reward: "Welcome badge",               threshold: 1,       metric: "orders",    unlocked: true,  unlockedAt: "Oct 2024" },
  { id: "m2",  icon: ShoppingBag, title: "10 Orders",     desc: "Complete 10 orders",                     reward: "$5 credit",                   threshold: 10,      metric: "orders",    unlocked: true,  unlockedAt: "Oct 2024" },
  { id: "m3",  icon: TrendingUp,  title: "$1k Revenue",   desc: "Earn $1,000 in total revenue",           reward: "Growth badge",                threshold: 100000,  metric: "revenue",   unlocked: true,  unlockedAt: "Nov 2024" },
  { id: "m4",  icon: Users,       title: "50 Customers",  desc: "Serve 50 unique customers",              reward: "Community badge",             threshold: 50,      metric: "customers", unlocked: true,  unlockedAt: "Jan 2025" },
  { id: "m5",  icon: Star,        title: "5-Star Store",  desc: "Maintain a 4.8+ average rating",        reward: "Quality badge",               threshold: 5,       metric: "orders",    unlocked: true,  unlockedAt: "Feb 2025" },
  { id: "m6",  icon: Crown,       title: "100 Orders",    desc: "Complete 100 orders",                    reward: "Pro seller badge",            threshold: 100,     metric: "orders",    unlocked: true,  unlockedAt: "Mar 2025" },
  { id: "m7",  icon: Trophy,      title: "$5k Revenue",   desc: "Earn $5,000 in total revenue",           reward: "$20 credit",                  threshold: 500000,  metric: "revenue",   unlocked: false },
  { id: "m8",  icon: Flame,       title: "200 Orders",    desc: "Complete 200 orders",                    reward: "Elite badge",                 threshold: 200,     metric: "orders",    unlocked: false },
  { id: "m9",  icon: Crown,       title: "$10k Revenue",  desc: "Hit $10,000 in total revenue",           reward: "$50 credit + Pro upgrade",    threshold: 1000000, metric: "revenue",   unlocked: false },
  { id: "m10", icon: Trophy,      title: "500 Customers", desc: "Build a community of 500 customers",     reward: "Community leader badge",      threshold: 500,     metric: "customers", unlocked: false },
]

const STREAK_DAYS = 12

export default function GoalsPage() {
  const [targets, setTargets]         = React.useState(DEFAULT_TARGETS)
  const [editingGoal, setEditingGoal] = React.useState<GoalTarget | null>(null)
  const [addCustomOpen, setAddCustomOpen] = React.useState(false)
  const [customGoals, setCustomGoals] = React.useState<CustomGoal[]>([])
  const [tipIdx, setTipIdx]           = React.useState<Record<string, number>>({ revenue: 0, orders: 0, customers: 0, products: 0 })
  const [streakFrozen, setStreakFrozen] = React.useState(false)

  React.useEffect(() => {
    setTargets(loadTargets())
    setCustomGoals(loadCustomGoals())
    setStreakFrozen(loadFrozen())
  }, [])

  const updateTarget = (key: keyof typeof DEFAULT_TARGETS, value: number) => {
    const next = { ...targets, [key]: value }
    setTargets(next)
    saveTargets(next)
  }

  const nextTip = (key: string) => {
    setTipIdx(prev => ({ ...prev, [key]: (prev[key] + 1) % (AI_TIPS[key]?.length ?? 1) }))
  }

  const addCustomGoal = (g: CustomGoal) => {
    const next = [...customGoals, g]
    setCustomGoals(next)
    saveCustomGoals(next)
  }

  const removeCustomGoal = (id: string) => {
    const next = customGoals.filter(g => g.id !== id)
    setCustomGoals(next)
    saveCustomGoals(next)
    toast({ title: "Custom goal removed" })
  }

  const toggleFreeze = () => {
    const next = !streakFrozen
    setStreakFrozen(next)
    localStorage.setItem(FREEZE_KEY, next ? "1" : "0")
    toast({
      title: next ? "Streak freeze activated!" : "Streak freeze deactivated",
      variant: next ? "success" : "default",
    })
  }

  const goals: GoalTarget[] = [
    {
      id: "revenue",
      label: "Monthly Revenue",
      icon: TrendingUp,
      current: CURRENT_VALUES.revenue,
      target: targets.revenue,
      unit: "",
      prefix: "$",
      color: "text-brand-purple",
      bg: "bg-brand-purple/10",
      border: "border-brand-purple/20",
      tip: AI_TIPS.revenue[tipIdx.revenue],
      lastMonth: LAST_MONTH_VALUES.revenue,
    },
    {
      id: "orders",
      label: "Monthly Orders",
      icon: ShoppingBag,
      current: CURRENT_VALUES.orders,
      target: targets.orders,
      unit: "",
      prefix: "",
      color: "text-brand-coral",
      bg: "bg-brand-coral/10",
      border: "border-brand-coral/20",
      tip: AI_TIPS.orders[tipIdx.orders],
      lastMonth: LAST_MONTH_VALUES.orders,
    },
    {
      id: "customers",
      label: "New Customers",
      icon: Users,
      current: CURRENT_VALUES.customers,
      target: targets.customers,
      unit: "",
      prefix: "",
      color: "text-brand-green",
      bg: "bg-brand-green/10",
      border: "border-brand-green/20",
      tip: AI_TIPS.customers[tipIdx.customers],
      lastMonth: LAST_MONTH_VALUES.customers,
    },
    {
      id: "products",
      label: "Products Listed",
      icon: BarChart3,
      current: CURRENT_VALUES.products,
      target: targets.products,
      unit: "",
      prefix: "",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      tip: AI_TIPS.products[tipIdx.products],
      lastMonth: LAST_MONTH_VALUES.products,
    },
  ]

  const unlockedCount = MILESTONES_DATA.filter(m => m.unlocked).length

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold">Growth Goals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track your monthly targets and unlock milestones</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Streak freeze toggle */}
          <button onClick={toggleFreeze}
            className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold transition-all",
              streakFrozen
                ? "border-brand-purple/30 bg-brand-purple/10 text-brand-purple"
                : "border-border hover:bg-muted text-muted-foreground"
            )}>
            <ShieldCheck className="h-3.5 w-3.5" />
            {streakFrozen ? "Freeze ON" : "Freeze streak"}
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-coral/10 border border-brand-coral/20">
            <Flame className="h-4 w-4 text-brand-coral" />
            <span className="text-sm font-bold text-brand-coral">{STREAK_DAYS}-day streak</span>
            {streakFrozen && <span className="text-[10px] text-brand-purple font-semibold">❄️ Frozen</span>}
          </div>
        </div>
      </div>

      {/* Period badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="brand" size="sm">May 2026</Badge>
        <span className="text-xs text-muted-foreground">12 days remaining</span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground">{unlockedCount}/{MILESTONES_DATA.length} milestones unlocked</span>
        {streakFrozen && (
          <span className="text-[10px] font-semibold text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-2 py-0.5 rounded-full">
            ❄️ Streak protected today
          </span>
        )}
      </div>

      {/* Goal cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {goals.map((goal, i) => (
          <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GoalCard goal={goal} onEdit={() => setEditingGoal(goal)} />
            <button onClick={() => nextTip(goal.id)} className="mt-1.5 ml-1 text-[10px] text-brand-purple hover:underline flex items-center gap-1">
              <Bot className="h-3 w-3" /> Different tip
            </button>
          </motion.div>
        ))}
      </div>

      {/* Custom goals */}
      {customGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display font-bold text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-brand-purple" /> Custom Goals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customGoals.map(g => {
              const pct = Math.min(Math.round((g.current / g.target) * 100), 100)
              return (
                <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">{g.label}</p>
                    <button onClick={() => removeCustomGoal(g.id)} className="p-1 rounded-lg hover:bg-muted">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-display text-xl font-extrabold text-brand-purple">{pct}%</span>
                    <span className="text-xs text-muted-foreground">of goal</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {g.prefix}{g.current.toLocaleString()}{g.unit} / {g.prefix}{g.target.toLocaleString()}{g.unit}
                  </p>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full bg-brand-purple rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add custom goal CTA */}
      <button onClick={() => setAddCustomOpen(true)}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl border border-dashed border-border hover:border-brand-purple/40 hover:bg-brand-purple/5 text-sm text-muted-foreground hover:text-brand-purple transition-all font-semibold">
        <Plus className="h-4 w-4" /> Add Custom Goal
      </button>

      {/* Weekly breakdown */}
      <WeeklyBreakdown goals={goals} />

      {/* Streak calendar heatmap */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-sm flex items-center gap-2">
            <Flame className="h-4 w-4 text-brand-coral" /> Sales streak — May 2026
          </h2>
          <div className="flex items-center gap-2">
            {streakFrozen && <span className="text-[10px] text-brand-purple font-semibold">❄️ Protected</span>}
            <span className="text-xs font-semibold text-brand-coral">{STREAK_DAYS} days 🔥</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 31 }, (_, i) => {
            const day = i + 1
            const today = 12
            const hasSale = day <= today && (day % 7 !== 0)
            const isToday = day === today
            const isFuture = day > today
            return (
              <div key={i} title={`May ${day}`}
                className={cn(
                  "aspect-square rounded-lg text-[9px] font-bold flex items-center justify-center transition-all",
                  isFuture && "bg-muted/30 text-muted-foreground/20",
                  !isFuture && hasSale && "bg-brand-green/20 text-brand-green",
                  !isFuture && !hasSale && !isToday && "bg-brand-coral/10 text-brand-coral",
                  isToday && "bg-brand-purple text-white ring-2 ring-brand-purple/30"
                )}>
                {day}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-green/20 border border-brand-green/30" />Sale day</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-coral/10 border border-brand-coral/20" />No sale</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted/30 border border-muted" />Upcoming</div>
        </div>
      </div>

      {/* Milestones */}
      <div>
        <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" /> Milestones
        </h2>
        <div className="space-y-2">
          {MILESTONES_DATA.map((m, i) => (
            <motion.div key={m.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                m.unlocked
                  ? "border-brand-green/20 bg-brand-green/5"
                  : "border-border bg-card opacity-60"
              )}>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl flex-shrink-0",
                m.unlocked ? "bg-brand-green/15" : "bg-muted"
              )}>
                {m.unlocked
                  ? <m.icon className="h-5 w-5 text-brand-green" />
                  : <Lock className="h-4 w-4 text-muted-foreground" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn("text-sm font-bold", m.unlocked ? "text-foreground" : "text-muted-foreground")}>{m.title}</p>
                  {m.unlocked && <CheckCircle2 className="h-3.5 w-3.5 text-brand-green flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                {/* Progress toward locked milestones */}
                {!m.unlocked && (() => {
                  const cur = CURRENT_VALUES[m.metric] ?? 0
                  const pct = Math.min(Math.round((cur / m.threshold) * 100), 100)
                  return pct > 0 ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                        <motion.div className="h-full bg-amber-500 rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.04 }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{pct}%</span>
                    </div>
                  ) : null
                })()}
              </div>

              <div className="text-right flex-shrink-0">
                {m.unlocked && (
                  <button onClick={() => {
                    const msg = `🏆 I just unlocked "${m.title}" on Lummy! ${m.reward} earned. My creator journey is 🚀`
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank")
                  }} className="p-1 rounded-lg hover:bg-muted transition-colors mb-1">
                    <Share2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
                <div className={cn(
                  "text-[10px] font-bold px-2.5 py-1 rounded-full",
                  m.unlocked ? "bg-brand-green/15 text-brand-green" : "bg-muted text-muted-foreground"
                )}>
                  {m.reward}
                </div>
                {m.unlockedAt && (
                  <p className="text-[9px] text-muted-foreground mt-1">{m.unlockedAt}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI growth suggestions */}
      <div className="rounded-2xl border border-brand-purple/20 bg-gradient-to-br from-brand-purple/5 to-brand-indigo/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-purple/15">
            <Bot className="h-4 w-4 text-brand-purple" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm">AI Growth Suggestions</h3>
            <p className="text-[10px] text-muted-foreground">Based on your current progress</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {[
            { icon: MessageCircle, text: "Broadcast a 15% flash sale to your 847 WhatsApp subscribers — you need $187 more revenue this month.", action: "Create broadcast", href: "/dashboard/broadcast" },
            { icon: ShoppingBag,   text: "Restock your Leather Mini Bag — it's your 3rd best seller and has been out of stock for 4 days.", action: "Go to products",   href: "/dashboard/products" },
            { icon: Target,        text: "You're on track for your orders goal! Post on TikTok today to push past 150 orders before end of month.", action: "Open calendar",   href: "/dashboard/calendar" },
          ].map((tip, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-background/60 border border-border">
              <tip.icon className="h-4 w-4 text-brand-purple flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{tip.text}</p>
              <a href={tip.href} className="flex items-center gap-0.5 text-[10px] font-semibold text-brand-purple hover:underline whitespace-nowrap flex-shrink-0">
                {tip.action} <ArrowRight className="h-2.5 w-2.5" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {editingGoal && (
          <EditGoalModal
            key="edit-goal"
            goal={editingGoal}
            onSave={v => updateTarget(editingGoal.id as keyof typeof DEFAULT_TARGETS, v)}
            onClose={() => setEditingGoal(null)}
          />
        )}
        {addCustomOpen && (
          <AddCustomGoalModal
            key="add-custom"
            onSave={addCustomGoal}
            onClose={() => setAddCustomOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
