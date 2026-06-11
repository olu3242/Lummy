"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Sparkles, TrendingUp, TrendingDown, Minus, CheckCircle2,
  AlertCircle, Info, RefreshCw, ChevronRight, Target, Zap,
  ArrowRight, BadgeCheck, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/globalization"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Agent {
  name: string
  displayName: string
  description: string
  emoji: string
  color: string
  activeRecommendations: number
}

interface KPIData {
  pipeline: { totalRevenue: number; totalOrders: number; paidOrders: number; paymentSuccessRate: number; revenueThisMonth: number; trend: string }
  health: { score: number; grade: string; components: { label: string; score: number; maxScore: number; note: string }[] }
  success: { score: number; grade: string }
  forecast: { low: number; mid: number; high: number; confidence: number }
}

interface Recommendation {
  id: string
  agent_name: string
  title: string
  description: string
  confidence: number
  impact_score: number
  status: string
  created_at: string
}

interface Objective {
  id: string
  title: string
  objective_type: string
  target_value: number
  current_value: number
  unit: string
  progress: number
  status: string
}

// ── Component Helpers ─────────────────────────────────────────────────────────

function GradeChip({ grade }: { grade: string }) {
  const color = grade === 'A' ? 'text-brand-green bg-brand-green/10' : grade === 'B' ? 'text-brand-purple bg-brand-purple/10' : grade === 'C' ? 'text-amber-500 bg-amber-500/10' : 'text-brand-coral bg-brand-coral/10'
  return <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", color)}>{grade}</span>
}

function HealthBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0
  return (
    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-brand-green" : pct >= 50 ? "bg-brand-purple" : "bg-amber-500")}
        style={{ width: `${pct}%` }} />
    </div>
  )
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical') return <AlertCircle className="h-3.5 w-3.5 text-brand-coral flex-shrink-0" />
  if (severity === 'warning') return <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
  return <Info className="h-3.5 w-3.5 text-brand-purple flex-shrink-0" />
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentOSPage() {
  const [agents, setAgents] = React.useState<Agent[]>([])
  const [kpis, setKpis] = React.useState<KPIData | null>(null)
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>([])
  const [objectives, setObjectives] = React.useState<Objective[]>([])
  const [loading, setLoading] = React.useState(true)
  const [running, setRunning] = React.useState(false)

  const loadAll = React.useCallback(async () => {
    setLoading(true)
    try {
      const [agentsRes, kpisRes, objectivesRes] = await Promise.all([
        fetch("/api/agents").then(r => r.ok ? r.json() : null),
        fetch("/api/business/kpis").then(r => r.ok ? r.json() : null),
        fetch("/api/business/objectives").then(r => r.ok ? r.json() : null),
      ])

      if (agentsRes?.data) setAgents(agentsRes.data)
      if (kpisRes?.data) setKpis(kpisRes.data)
      if (objectivesRes?.data) setObjectives(objectivesRes.data)

      // Load active recommendations
      const recsRes = await fetch("/api/agent-actions").then(r => r.ok ? r.json() : null) as { data?: unknown[] } | null
      if (recsRes?.data) setRecommendations(recsRes.data as Recommendation[])
    } catch { /* non-fatal */ }
    finally { setLoading(false) }
  }, [])

  React.useEffect(() => { loadAll() }, [loadAll])

  const runAllAgents = async () => {
    setRunning(true)
    try {
      await Promise.all(["NOVA", "ATLAS", "TREASURY", "PULSE", "MERCHANT", "ASCEND"].map(name =>
        fetch(`/api/agents?run=${name}`, { method: "POST" })
      ))
      await loadAll()
    } catch { /* non-fatal */ }
    finally { setRunning(false) }
  }

  const trendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-3.5 w-3.5 text-brand-green" />
    if (trend === 'declining') return <TrendingDown className="h-3.5 w-3.5 text-brand-coral" />
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-purple" /> Agent OS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Centralized intelligence for your creator business</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={runAllAgents} disabled={running} className="h-9 gap-1.5">
            {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {running ? "Analyzing…" : "Run Analysis"}
          </Button>
          <Link href="/dashboard/copilot">
            <Button size="sm" className="h-9 gap-1.5">
              <Sparkles className="h-4 w-4" /> Ask Lummy
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          {kpis && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Revenue (MTD)", value: formatMoney(kpis.pipeline.revenueThisMonth), sub: `Total: ${formatMoney(kpis.pipeline.totalRevenue)}`, trend: kpis.pipeline.trend },
                { label: "Paid Orders", value: kpis.pipeline.paidOrders.toString(), sub: `${kpis.pipeline.totalOrders} total orders`, trend: "stable" },
                { label: "Payment Success", value: `${Math.round(kpis.pipeline.paymentSuccessRate * 100)}%`, sub: "Last 30 days", trend: kpis.pipeline.paymentSuccessRate >= 0.8 ? "improving" : "declining" },
                { label: "30d Forecast", value: formatMoney(kpis.forecast.mid), sub: `${Math.round(kpis.forecast.confidence * 100)}% confidence`, trend: "stable" },
              ].map(card => (
                <div key={card.label} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{card.label}</p>
                    {trendIcon(card.trend)}
                  </div>
                  <p className="font-display text-lg font-extrabold">{card.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Store Health + Success Score */}
          {kpis && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Store Health */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm">Store Health</h2>
                  <GradeChip grade={kpis.health.grade} />
                </div>
                <div className="space-y-2">
                  {kpis.health.components.map(c => (
                    <div key={c.label} className="flex items-center gap-2">
                      {c.score === c.maxScore
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-brand-green flex-shrink-0" />
                        : <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                      <span className="text-xs text-muted-foreground flex-1 truncate">{c.note}</span>
                      <HealthBar score={c.score} maxScore={c.maxScore} />
                      <span className="text-[10px] text-muted-foreground w-12 text-right">{c.score}/{c.maxScore}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Overall score</span>
                  <span className="font-display font-bold text-brand-purple">{kpis.health.score}/100</span>
                </div>
              </div>

              {/* Success Score */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm">Creator Success Score</h2>
                  <GradeChip grade={kpis.success.grade} />
                </div>
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
                      <circle cx="56" cy="56" r="44" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                      <circle cx="56" cy="56" r="44" fill="none" stroke="currentColor" strokeWidth="10"
                        className="text-brand-purple" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 44}
                        strokeDashoffset={2 * Math.PI * 44 * (1 - kpis.success.score / 100)}
                        style={{ transition: "stroke-dashoffset 1.2s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-3xl font-extrabold">{kpis.success.score}</span>
                      <span className="text-[10px] text-muted-foreground">out of 100</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {kpis.success.score >= 70 ? "You're on a great trajectory!" : kpis.success.score >= 40 ? "Growing — keep pushing!" : "Early stage — follow the setup guide"}
                </p>
              </div>
            </motion.div>
          )}

          {/* Business Objectives */}
          {objectives.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm flex items-center gap-2"><Target className="h-4 w-4 text-brand-purple" /> Business Objectives</h2>
              </div>
              <div className="space-y-3">
                {objectives.map(obj => (
                  <div key={obj.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">{obj.title}</p>
                      <span className="text-[10px] text-muted-foreground">{obj.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", obj.progress >= 100 ? "bg-brand-green" : "bg-brand-purple")}
                        style={{ width: `${Math.min(100, obj.progress)}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {formatMoney(obj.current_value)} of {formatMoney(obj.target_value)} target
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Agent Grid */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-brand-purple" /> Active Agents</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {agents.map(agent => (
                <div key={agent.name}
                  className="rounded-2xl border border-border bg-card p-4 hover:border-brand-purple/30 hover:bg-brand-purple/5 transition-all cursor-default">
                  <div className="text-2xl mb-2">{agent.emoji}</div>
                  <p className="text-sm font-semibold">{agent.displayName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{agent.description}</p>
                  {agent.activeRecommendations > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full">
                      <Sparkles className="h-2.5 w-2.5" /> {agent.activeRecommendations} rec
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Link href="/dashboard/copilot">
              <div className="rounded-2xl bg-gradient-to-r from-brand-purple/10 to-brand-purple/5 border border-brand-purple/20 p-5 flex items-center justify-between group hover:border-brand-purple/40 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Ask Lummy anything</p>
                    <p className="text-xs text-muted-foreground">Get AI-powered insights about your business</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-brand-purple group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        </>
      )}
    </div>
  )
}
