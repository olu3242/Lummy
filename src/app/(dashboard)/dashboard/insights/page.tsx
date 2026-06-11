"use client"

import * as React from "react"
import {
  TrendingUp, TrendingDown, Minus, Flame, AlertTriangle, CheckCircle2,
  ChevronRight, Zap, Target, RefreshCw, ArrowUpRight, Package, MessageCircle,
  Star, Award, Lock, Play, Share2, BadgeCheck, Rocket,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatMoney, formatCompactMoney } from "@/lib/globalization"

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

interface CreatorAction {
  key: string
  title: string
  description: string
  ctaLabel: string
  ctaUrl: string
  priority: "urgent" | "high" | "medium" | "low"
  category: string
  impact: string
}

interface ActionsData {
  actions: CreatorAction[]
  completedCount: number
  urgentCount: number
}

interface MonetizationScorecard {
  grade: "A" | "B" | "C" | "D" | "F"
  score: number
  revenueThisMonthKobo: number
  monthOverMonthPct: number
  totalOrders: number
  conversionRate: number
  velocityTrend: "accelerating" | "steady" | "slowing" | "inactive"
  topPriority: string
  monetizationMilestones: string[]
}

interface FirstSaleData {
  hasFirstSale: boolean
  daysSinceSignup: number
  readinessScore: number
  nudge: string | null
  gaps: Array<{ type: string; label: string; suggestion: string; priority: string }>
}

interface EcosystemData {
  score: number
  tier: "inactive" | "participant" | "contributor" | "leader"
  referralCount: number
  activeCollaborations: number
  highlights: string[]
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
  return formatCompactMoney(n)
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
                {new Date(m.achievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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

// ─── Action Center ────────────────────────────────────────────────────────────

const ACTION_PRIORITY_STYLE = {
  urgent: "border-red-500/30 bg-red-500/5",
  high:   "border-amber-400/20 bg-amber-400/5",
  medium: "border-white/8 bg-white/3",
  low:    "border-white/5 bg-white/2",
}

const ACTION_BADGE_STYLE = {
  urgent: "bg-red-500/15 text-red-400",
  high:   "bg-amber-400/10 text-amber-400",
  medium: "bg-white/5 text-white/40",
  low:    "bg-white/5 text-white/25",
}

function ActionCenter({
  data,
  onComplete,
}: {
  data: ActionsData
  onComplete: (key: string) => void
}) {
  const { actions, urgentCount } = data
  if (actions.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-brand-green/20 bg-brand-green/5">
        <CheckCircle2 className="h-5 w-5 text-brand-green flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-white">All clear — you're on track!</p>
          <p className="text-xs text-white/50 mt-0.5">Keep sharing your store link to drive more traffic.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Play className="h-4 w-4 text-white/40" />
        <h2 className="font-semibold text-white text-sm">Your action plan</h2>
        {urgentCount > 0 && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
            {urgentCount} urgent
          </span>
        )}
        <span className="ml-auto text-xs text-white/30">{actions.length} to do</span>
      </div>
      <div className="space-y-2">
        {actions.map(action => (
          <div key={action.key} className={cn(
            "flex items-start gap-3 p-4 rounded-2xl border transition-all",
            ACTION_PRIORITY_STYLE[action.priority]
          )}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-white leading-tight">{action.title}</p>
                <span className={cn("flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full", ACTION_BADGE_STYLE[action.priority])}>
                  {action.priority}
                </span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{action.description}</p>
              <p className="text-[10px] text-brand-green mt-1">{action.impact}</p>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <a
                href={action.ctaUrl}
                className="flex items-center gap-1 text-xs font-medium text-brand-purple hover:text-white bg-brand-purple/10 hover:bg-brand-purple/20 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
              >
                {action.ctaLabel}
                <ArrowUpRight className="h-3 w-3" />
              </a>
              {(action.category === "marketing" || action.category === "ecosystem") && (
                <button
                  onClick={() => onComplete(action.key)}
                  className="text-[10px] text-white/25 hover:text-white/60 transition-colors text-center"
                >
                  Mark done
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Monetization Scorecard ───────────────────────────────────────────────────

const GRADE_CONFIG = {
  A: { color: "text-brand-green",  bg: "bg-brand-green/10",  label: "Excellent" },
  B: { color: "text-sky-400",      bg: "bg-sky-400/10",      label: "Good" },
  C: { color: "text-amber-400",    bg: "bg-amber-400/10",    label: "Needs work" },
  D: { color: "text-orange-400",   bg: "bg-orange-400/10",   label: "At risk" },
  F: { color: "text-red-400",      bg: "bg-red-500/10",      label: "Inactive" },
}

const VELOCITY_LABELS = {
  accelerating: { label: "Accelerating 📈", color: "text-brand-green" },
  steady:       { label: "Steady",           color: "text-white/60" },
  slowing:      { label: "Slowing ⚠",       color: "text-amber-400" },
  inactive:     { label: "No recent sales",  color: "text-red-400" },
}

function MonetizationScorecardCard({ scorecard }: { scorecard: MonetizationScorecard }) {
  const g = GRADE_CONFIG[scorecard.grade]
  const v = VELOCITY_LABELS[scorecard.velocityTrend]

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="h-4 w-4 text-white/40" />
        <h2 className="font-semibold text-white text-sm">Monetization Score</h2>
        <div className={cn("ml-auto flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-bold", g.bg)}>
          <span className={g.color}>{scorecard.grade}</span>
          <span className="text-white/30 text-xs font-normal">{g.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-xs text-white/40 mb-0.5">This month</p>
          <p className="text-lg font-bold text-white">{fmt(scorecard.revenueThisMonthKobo)}</p>
        </div>
        <div>
          <p className="text-xs text-white/40 mb-0.5">Orders</p>
          <p className="text-lg font-bold text-white">{scorecard.totalOrders}</p>
        </div>
        <div>
          <p className="text-xs text-white/40 mb-0.5">Velocity</p>
          <p className={cn("text-sm font-medium", v.color)}>{v.label}</p>
        </div>
      </div>

      {scorecard.monetizationMilestones.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {scorecard.monetizationMilestones.map(m => (
            <span key={m} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple/80">
              <BadgeCheck className="h-2.5 w-2.5" />
              {m.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-white/50 bg-white/3 rounded-lg px-3 py-2">
        {scorecard.topPriority}
      </p>
    </div>
  )
}

// ─── First-Sale Accelerator ───────────────────────────────────────────────────

function FirstSaleAccelerator({ firstSale }: { firstSale: FirstSaleData }) {
  if (firstSale.hasFirstSale) return null

  const urgentGaps = firstSale.gaps.filter(g => g.priority === "high" && g.type !== "ready")

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-amber-400" />
        <h2 className="font-semibold text-white text-sm">Get your first sale</h2>
        <span className="ml-auto text-xs text-amber-400 font-medium">{firstSale.readinessScore}% ready</span>
      </div>

      {firstSale.nudge && (
        <p className="text-xs text-white/60 bg-white/5 rounded-lg px-3 py-2 mb-3 leading-relaxed">
          {firstSale.nudge}
        </p>
      )}

      <div className="space-y-2">
        {urgentGaps.slice(0, 3).map(gap => (
          <div key={gap.type} className="flex items-start gap-2">
            <div className="h-4 w-4 rounded-full border border-amber-400/40 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-white/80">{gap.label}</p>
              <p className="text-xs text-white/40">{gap.suggestion}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: `${firstSale.readinessScore}%` }}
        />
      </div>
    </div>
  )
}

// ─── Ecosystem Card ───────────────────────────────────────────────────────────

const ECOSYSTEM_TIER = {
  inactive:    { color: "text-white/30",  label: "Not started" },
  participant: { color: "text-sky-400",   label: "Participant" },
  contributor: { color: "text-brand-purple", label: "Contributor" },
  leader:      { color: "text-amber-400", label: "Leader" },
}

function EcosystemCard({ ecosystem }: { ecosystem: EcosystemData }) {
  const tier = ECOSYSTEM_TIER[ecosystem.tier]
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
        <Share2 className="h-5 w-5 text-white/40" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white">Ecosystem</p>
          <span className={cn("text-xs font-medium", tier.color)}>{tier.label}</span>
        </div>
        {ecosystem.highlights.length > 0 ? (
          <p className="text-xs text-white/40 mt-0.5 truncate">{ecosystem.highlights.join(" · ")}</p>
        ) : (
          <p className="text-xs text-white/30 mt-0.5">Refer creators and collaborate to grow faster</p>
        )}
      </div>
      <a href="/dashboard/referrals" className="flex-shrink-0 flex items-center gap-1 text-xs text-brand-purple hover:text-brand-purple/80">
        {ecosystem.tier === "inactive" ? "Get started" : "View"}
        <ChevronRight className="h-3 w-3" />
      </a>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [insights, setInsights] = React.useState<InsightsData | null>(null)
  const [lifecycle, setLifecycle] = React.useState<LifecycleData | null>(null)
  const [actions, setActions] = React.useState<ActionsData | null>(null)
  const [monetization, setMonetization] = React.useState<{ scorecard: MonetizationScorecard | null; firstSale: FirstSaleData | null; ecosystem: EcosystemData | null } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [lastRefresh, setLastRefresh] = React.useState<Date>(new Date())

  const fetchAll = React.useCallback(async () => {
    setLoading(true)
    try {
      const [insightsRes, lifecycleRes, actionsRes, monetizationRes] = await Promise.allSettled([
        fetch("/api/creator/insights", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
        fetch("/api/creator/lifecycle", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
        fetch("/api/creator/actions", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
        fetch("/api/creator/monetization", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
      ])

      if (insightsRes.status === "fulfilled" && insightsRes.value) setInsights(insightsRes.value as InsightsData)
      if (lifecycleRes.status === "fulfilled" && lifecycleRes.value) setLifecycle(lifecycleRes.value as LifecycleData)
      if (actionsRes.status === "fulfilled" && actionsRes.value) setActions(actionsRes.value as ActionsData)
      if (monetizationRes.status === "fulfilled" && monetizationRes.value) {
        setMonetization(monetizationRes.value as { scorecard: MonetizationScorecard | null; firstSale: FirstSaleData | null; ecosystem: EcosystemData | null })
      }
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  const completeAction = React.useCallback(async (key: string) => {
    // Optimistically remove action
    setActions(prev => prev ? { ...prev, actions: prev.actions.filter(a => a.key !== key) } : prev)
    await fetch("/api/creator/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionKey: key }),
    }).catch(() => {})
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
            Refreshed {lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
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

      {/* Action Center */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : actions ? (
        <ActionCenter data={actions} onComplete={key => void completeAction(key)} />
      ) : null}

      {/* First-sale accelerator — only for creators without first sale */}
      {!loading && monetization?.firstSale && !monetization.firstSale.hasFirstSale && (
        <FirstSaleAccelerator firstSale={monetization.firstSale} />
      )}

      {/* Monetization scorecard */}
      {loading ? (
        <Skeleton className="h-44" />
      ) : monetization?.scorecard ? (
        <MonetizationScorecardCard scorecard={monetization.scorecard} />
      ) : null}

      {/* Ecosystem participation */}
      {!loading && monetization?.ecosystem && (
        <EcosystemCard ecosystem={monetization.ecosystem} />
      )}

      {/* Milestones */}
      {loading ? (
        <Skeleton className="h-64" />
      ) : lifecycle ? (
        <MilestonesPanel lifecycle={lifecycle} />
      ) : null}

      {/* Revenue opportunities below the fold */}
      {!loading && insights?.opportunities && insights.opportunities.filter(o => o.priority !== "high").length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-white/40" />
            <h2 className="font-semibold text-white text-sm">More opportunities</h2>
          </div>
          <div className="space-y-2">
            {insights.opportunities
              .filter(o => o.priority !== "high")
              .slice(0, 3)
              .map((opp) => (
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
