"use client"

import * as React from "react"
import {
  TrendingUp, TrendingDown, Minus, Flame, AlertTriangle, CheckCircle2,
  ChevronRight, Zap, Target, RefreshCw, ArrowUpRight, Package, MessageCircle,
  Star, Award, Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface RevenueSummary {
  totalRevenueKobo: number
  totalOrders: number
  avgOrderValueKobo: number
  revenueThisMonth: number
  revenueLastMonth: number
  monthOverMonthPct: number
  conversionRate: number
}

interface EngagementData {
  score: number
  streakDays: number
  momentumTrend: "rising" | "stable" | "declining"
  lastActiveAt: string | null
}

interface ChurnRisk {
  riskScore: number
  riskTier: "low" | "medium" | "high" | "critical"
  signals: string[]
}

interface ConversionAudit {
  score: number
  passedChecks: string[]
  failedChecks: string[]
  topRecommendation: string
}

interface Opportunity {
  type: string
  title: string
  description: string
  estimatedUplift: string
  priority: "high" | "medium" | "low"
}

interface Milestone {
  key: string
  label: string
  icon: string
  description: string
  achieved: boolean
  achievedAt: string | null
}

interface LifecycleData {
  engagement: EngagementData
  milestones: Milestone[]
  achievedCount: number
  totalMilestones: number
  lifecycleStage: string
  nextMilestone: Milestone | null
}

interface InsightsData {
  revenue: RevenueSummary | null
  opportunities: Opportunity[]
  engagement: EngagementData | null
  churnRisk: ChurnRisk | null
  conversion: ConversionAudit | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  onboarding:     { label: "Getting started", color: "text-white/50" },
  getting_started:{ label: "Building momentum", color: "text-amber-400" },
  building:       { label: "Building catalogue", color: "text-sky-400" },
  monetizing:     { label: "Monetizing", color: "text-brand-green" },
  scaling:        { label: "Scaling", color: "text-brand-purple" },
}

const CHURN_CONFIG = {
  low:      { color: "text-brand-green",  bg: "bg-brand-green/10",  label: "Looking good" },
  medium:   { color: "text-amber-400",    bg: "bg-amber-400/10",    label: "At risk" },
  high:     { color: "text-orange-400",   bg: "bg-orange-400/10",   label: "High risk" },
  critical: { color: "text-red-400",      bg: "bg-red-500/10",      label: "Critical" },
}

function fmt(kobo: number): string {
  const n = kobo / 100
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(1)}k`
  return `₦${n.toLocaleString()}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-white/5", className)} />
}

function MomentumIcon({ trend }: { trend: EngagementData["momentumTrend"] }) {
  if (trend === "rising")   return <TrendingUp className="h-4 w-4 text-brand-green" />
  if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-400" />
  return <Minus className="h-4 w-4 text-white/40" />
}

function MomPct({ pct }: { pct: number }) {
  const up = pct >= 0
  return (
    <span className={cn("text-xs font-medium", up ? "text-brand-green" : "text-red-400")}>
      {up ? "+" : ""}{pct}%
    </span>
  )
}

function RevenueCards({ revenue }: { revenue: RevenueSummary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: "This month", value: fmt(revenue.revenueThisMonth), sub: <MomPct pct={revenue.monthOverMonthPct} /> },
        { label: "Total revenue", value: fmt(revenue.totalRevenueKobo), sub: `${revenue.totalOrders} orders` },
        { label: "Avg order value", value: fmt(revenue.avgOrderValueKobo), sub: null },
        { label: "Conversion rate", value: `${revenue.conversionRate}%`, sub: "views → orders" },
      ].map(card => (
        <div key={card.label} className="rounded-2xl border border-white/8 bg-white/3 p-4">
          <p className="text-xs text-white/40 mb-1">{card.label}</p>
          <p className="text-xl font-bold text-white">{card.value}</p>
          {card.sub && (
            typeof card.sub === "string"
              ? <p className="text-xs text-white/30 mt-0.5">{card.sub}</p>
              : <div className="mt-0.5">{card.sub}</div>
          )}
        </div>
      ))}
    </div>
  )
}

function EngagementCard({ engagement }: { engagement: EngagementData }) {
  const streakLabel = engagement.streakDays >= 7 ? "🔥 On fire!" :
    engagement.streakDays >= 3 ? "⚡ Building streak" : ""

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-4 w-4 text-white/40" />
        <h2 className="font-semibold text-white text-sm">Your Momentum</h2>
        <MomentumIcon trend={engagement.momentumTrend} />
        <span className="ml-auto text-xs text-white/30 capitalize">
          {engagement.momentumTrend}
        </span>
      </div>
      <div className="flex items-center gap-6">
        <div>
          <p className="text-3xl font-bold text-white">{engagement.streakDays}</p>
          <p className="text-xs text-white/40">day streak {streakLabel}</p>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/40">Engagement score</span>
            <span className={cn("font-medium",
              engagement.score >= 70 ? "text-brand-green" :
              engagement.score >= 40 ? "text-amber-400" : "text-red-400"
            )}>{engagement.score}/100</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all",
                engagement.score >= 70 ? "bg-brand-green" :
                engagement.score >= 40 ? "bg-amber-400" : "bg-red-400"
              )}
              style={{ width: `${engagement.score}%` }}
            />
          </div>
          <p className="text-[10px] text-white/20 mt-1">
            Based on activity over the last 14 days
          </p>
        </div>
      </div>
    </div>
  )
}

function ChurnWarning({ churn }: { churn: ChurnRisk }) {
  if (churn.riskTier === "low") return null
  const cfg = CHURN_CONFIG[churn.riskTier]

  return (
    <div className={cn("rounded-2xl border p-4 flex gap-3", cfg.bg,
      churn.riskTier === "critical" ? "border-red-500/30" : "border-amber-400/20"
    )}>
      <AlertTriangle className={cn("h-4 w-4 mt-0.5 flex-shrink-0", cfg.color)} />
      <div className="min-w-0">
        <p className={cn("text-sm font-semibold", cfg.color)}>
          {cfg.label}: Your store needs attention
        </p>
        <ul className="mt-1 space-y-0.5">
          {churn.signals.slice(0, 3).map(s => (
            <li key={s} className="text-xs text-white/50">· {s}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ConversionMeter({ conversion }: { conversion: ConversionAudit }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-4 w-4 text-white/40" />
        <h2 className="font-semibold text-white text-sm">Store Readiness</h2>
        <span className={cn("ml-auto text-sm font-bold",
          conversion.score >= 80 ? "text-brand-green" :
          conversion.score >= 50 ? "text-amber-400" : "text-red-400"
        )}>{conversion.score}%</span>
      </div>

      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
        <div
          className={cn("h-full rounded-full transition-all",
            conversion.score >= 80 ? "bg-brand-green" :
            conversion.score >= 50 ? "bg-amber-400" : "bg-red-400"
          )}
          style={{ width: `${conversion.score}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {[...conversion.passedChecks.map(c => ({ label: c, ok: true })),
          ...conversion.failedChecks.map(c => ({ label: c, ok: false }))
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs">
            {item.ok
              ? <CheckCircle2 className="h-3 w-3 text-brand-green flex-shrink-0" />
              : <div className="h-3 w-3 rounded-full border border-white/20 flex-shrink-0" />
            }
            <span className={item.ok ? "text-white/60" : "text-white/30"}>{item.label}</span>
          </div>
        ))}
      </div>

      {conversion.failedChecks.length > 0 && (
        <p className="text-xs text-amber-400/80 bg-amber-400/5 rounded-lg px-3 py-2">
          {conversion.topRecommendation}
        </p>
      )}
    </div>
  )
}

function RecommendationCard({ opp, index }: { opp: Opportunity; index: number }) {
  const PRIORITY_COLORS = { high: "text-red-400 bg-red-400/10", medium: "text-amber-400 bg-amber-400/10", low: "text-white/40 bg-white/5" }
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 transition-colors">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
        <span className="text-xs text-white/30 font-mono">{index + 1}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-white leading-tight">{opp.title}</p>
          <span className={cn("flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full", PRIORITY_COLORS[opp.priority])}>
            {opp.priority}
          </span>
        </div>
        <p className="text-xs text-white/50 mt-1 leading-relaxed">{opp.description}</p>
        {opp.estimatedUplift && (
          <p className="text-[10px] text-brand-green mt-1.5">{opp.estimatedUplift}</p>
        )}
      </div>
    </div>
  )
}

function MilestonesPanel({ lifecycle }: { lifecycle: LifecycleData }) {
  const stage = STAGE_LABELS[lifecycle.lifecycleStage] ?? { label: lifecycle.lifecycleStage, color: "text-white/50" }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Award className="h-4 w-4 text-white/40" />
        <h2 className="font-semibold text-white text-sm">Your Journey</h2>
        <span className={cn("ml-auto text-xs font-medium", stage.color)}>{stage.label}</span>
      </div>
      <p className="text-xs text-white/30 mb-4">
        {lifecycle.achievedCount}/{lifecycle.totalMilestones} milestones reached
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {lifecycle.milestones.map(m => (
          <div key={m.key} className={cn(
            "rounded-xl p-3 border text-center transition-all",
            m.achieved
              ? "border-brand-green/30 bg-brand-green/5"
              : "border-white/5 bg-white/2 opacity-50"
          )}>
            <div className="text-xl mb-1">{m.icon}</div>
            <p className={cn("text-xs font-medium", m.achieved ? "text-white" : "text-white/40")}>{m.label}</p>
            {m.achieved && m.achievedAt && (
              <p className="text-[9px] text-white/25 mt-0.5">
                {new Date(m.achievedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
              </p>
            )}
            {!m.achieved && (
              <Lock className="h-2.5 w-2.5 text-white/20 mx-auto mt-1" />
            )}
          </div>
        ))}
      </div>

      {lifecycle.nextMilestone && (
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
          <span className="text-lg">{lifecycle.nextMilestone.icon}</span>
          <div>
            <p className="text-xs text-white/60">Next milestone</p>
            <p className="text-sm font-medium text-white">{lifecycle.nextMilestone.label}</p>
            <p className="text-[10px] text-white/30">{lifecycle.nextMilestone.description}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [insights, setInsights] = React.useState<InsightsData | null>(null)
  const [lifecycle, setLifecycle] = React.useState<LifecycleData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [lastRefresh, setLastRefresh] = React.useState<Date>(new Date())

  const fetchAll = React.useCallback(async () => {
    setLoading(true)
    try {
      const [insightsRes, lifecycleRes] = await Promise.allSettled([
        fetch("/api/creator/insights", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
        fetch("/api/creator/lifecycle", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
      ])

      if (insightsRes.status === "fulfilled" && insightsRes.value) {
        setInsights(insightsRes.value as InsightsData)
      }
      if (lifecycleRes.status === "fulfilled" && lifecycleRes.value) {
        setLifecycle(lifecycleRes.value as LifecycleData)
      }
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { void fetchAll() }, [fetchAll])

  const topOpportunities = insights?.opportunities
    ?.filter(o => o.priority === "high")
    .slice(0, 3) ?? []

  const showChurnWarning = insights?.churnRisk?.riskTier !== "low"

  return (
    <div className="space-y-6 max-w-4xl pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Insights</h1>
          <p className="text-white/40 text-sm mt-1">
            Refreshed {lastRefresh.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <button
          onClick={() => void fetchAll()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all border border-white/8 disabled:opacity-40"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Churn warning — top priority if medium+ */}
      {!loading && insights?.churnRisk && showChurnWarning && (
        <ChurnWarning churn={insights.churnRisk} />
      )}

      {/* Revenue cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : insights?.revenue ? (
        <RevenueCards revenue={insights.revenue} />
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6 text-center">
          <Package className="h-8 w-8 text-white/20 mx-auto mb-2" />
          <p className="text-sm text-white/40">No sales yet — your first order will appear here</p>
          <a href="/dashboard/products/new" className="inline-flex items-center gap-1.5 mt-3 text-xs text-brand-purple hover:text-brand-purple/80 transition-colors">
            Add your first product <ChevronRight className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Engagement + Conversion row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </>
        ) : (
          <>
            {lifecycle?.engagement && <EngagementCard engagement={lifecycle.engagement} />}
            {insights?.conversion && <ConversionMeter conversion={insights.conversion} />}
          </>
        )}
      </div>

      {/* Top actions */}
      {(loading || topOpportunities.length > 0) && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-white/40" />
            <h2 className="font-semibold text-white text-sm">Top actions for you</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {topOpportunities.map((opp, i) => (
                <RecommendationCard key={opp.type} opp={opp} index={i} />
              ))}
              {topOpportunities.length === 0 && (
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-brand-green/20 bg-brand-green/5">
                  <CheckCircle2 className="h-5 w-5 text-brand-green flex-shrink-0" />
                  <p className="text-sm text-white/70">Your store looks great — keep sharing your link to drive more traffic!</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* WhatsApp optimization hint */}
      {!loading && insights?.conversion && insights.conversion.failedChecks.includes("WhatsApp connected") && (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Connect WhatsApp to unlock orders</p>
            <p className="text-xs text-white/50 mt-0.5">Creators with WhatsApp connected get 3× more orders on average.</p>
          </div>
          <a href="/dashboard/settings" className="flex-shrink-0 flex items-center gap-1 text-xs text-brand-purple hover:text-brand-purple/80 transition-colors">
            Set up <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Milestones */}
      {loading ? (
        <Skeleton className="h-64" />
      ) : lifecycle ? (
        <MilestonesPanel lifecycle={lifecycle} />
      ) : null}

      {/* Revenue opportunities below the fold */}
      {!loading && insights?.opportunities && insights.opportunities.length > topOpportunities.length && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-white/40" />
            <h2 className="font-semibold text-white text-sm">More opportunities</h2>
          </div>
          <div className="space-y-2">
            {insights.opportunities
              .filter(o => o.priority !== "high")
              .slice(0, 3)
              .map((opp, i) => (
                <div key={opp.type} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-colors cursor-pointer">
                  <Star className="h-3.5 w-3.5 text-white/20 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 truncate">{opp.title}</p>
                    <p className="text-xs text-white/30 truncate">{opp.estimatedUplift}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-white/20 flex-shrink-0" />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
