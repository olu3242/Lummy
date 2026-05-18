"use client"

import * as React from "react"
import {
  AlertTriangle, CheckCircle2, Clock, Zap, MessageCircle,
  RefreshCw, TrendingUp, CreditCard, Activity,
  Database, Shield, Users, Target, Play, Heart,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealthCheck {
  ok: boolean
  latencyMs?: number
  detail?: string
}

interface HealthData {
  status: "healthy" | "degraded"
  timestamp: string
  checks: {
    env: HealthCheck
    database: HealthCheck
    webhooks: HealthCheck
    ai: HealthCheck
    payments: HealthCheck
  }
}

interface WebhookEvent {
  id: string
  source: string
  event_type: string
  status: string
  attempt_count: number
  error_message: string | null
  created_at: string
}

interface StatCard {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  status?: "ok" | "warn" | "error"
}

interface GrowthMetrics {
  totalCreators: number
  publishedCreators: number
  creatorsWithProducts: number
  creatorsWithSales: number
  newCreators30d: number
}

interface HealthDistribution {
  totalScored: number
  healthy: number
  atRisk: number
  churned: number
  avgScore: number
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ ok, className }: { ok: boolean; className?: string }) {
  return (
    <span className={cn(
      "inline-block h-2 w-2 rounded-full flex-shrink-0",
      ok ? "bg-brand-green" : "bg-red-500",
      className
    )} />
  )
}

function CheckRow({ label, check }: { label: string; check: HealthCheck }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <StatusDot ok={check.ok} />
        <span className="text-sm text-white/70">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {check.latencyMs !== undefined && (
          <span className="text-xs text-white/30">{check.latencyMs}ms</span>
        )}
        <span className={cn("text-xs font-medium", check.ok ? "text-brand-green" : "text-red-400")}>
          {check.ok ? "OK" : check.detail ?? "FAIL"}
        </span>
      </div>
    </div>
  )
}

function StatCardItem({ card }: { card: StatCard }) {
  const statusColor = card.status === "error" ? "text-red-400"
    : card.status === "warn" ? "text-amber-400"
    : "text-brand-green"

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-xl bg-white/5">{card.icon}</div>
        {card.status && (
          <span className={cn("text-xs font-medium", statusColor)}>
            {card.status.toUpperCase()}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{card.value}</p>
      <p className="text-xs text-white/40 mt-0.5">{card.label}</p>
      {card.sub && <p className="text-xs text-white/25 mt-1">{card.sub}</p>}
    </div>
  )
}

const STATUS_COLOR: Record<string, string> = {
  processed: "text-brand-green bg-brand-green/10",
  pending:   "text-amber-400 bg-amber-400/10",
  failed:    "text-red-400 bg-red-400/10",
  dead:      "text-red-600 bg-red-600/15",
}

const JOB_LABELS: Record<string, string> = {
  health_scoring:       "Health Scoring",
  automation_processor: "Automation Processor",
  webhook_retry:        "Webhook Retry",
  notification_cleanup: "Notification Cleanup",
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OpsPage() {
  const [health, setHealth] = React.useState<HealthData | null>(null)
  const [webhooks, setWebhooks] = React.useState<WebhookEvent[]>([])
  const [growth, setGrowth] = React.useState<GrowthMetrics | null>(null)
  const [healthDist, setHealthDist] = React.useState<HealthDistribution | null>(null)
  const [runningJob, setRunningJob] = React.useState<string | null>(null)
  const [loadingHealth, setLoadingHealth] = React.useState(true)
  const [loadingWebhooks, setLoadingWebhooks] = React.useState(true)
  const [loadingGrowth, setLoadingGrowth] = React.useState(true)
  const [lastRefresh, setLastRefresh] = React.useState<Date>(new Date())

  const fetchHealth = React.useCallback(async () => {
    setLoadingHealth(true)
    try {
      const res = await fetch("/api/health", { cache: "no-store" })
      if (res.ok) setHealth(await res.json())
    } catch {
      toast({ title: "Health check failed", variant: "error" })
    } finally {
      setLoadingHealth(false)
    }
  }, [])

  const fetchWebhooks = React.useCallback(async () => {
    setLoadingWebhooks(true)
    try {
      const res = await fetch("/api/ops/webhooks", { cache: "no-store" })
      if (res.ok) {
        const { data } = await res.json()
        setWebhooks(data ?? [])
      }
    } catch {
      // Endpoint may not exist yet — fail gracefully
    } finally {
      setLoadingWebhooks(false)
    }
  }, [])

  const fetchGrowth = React.useCallback(async () => {
    setLoadingGrowth(true)
    try {
      const res = await fetch("/api/ops/growth", { cache: "no-store" })
      if (res.ok) {
        const { growth: g, health: h } = await res.json()
        if (g) setGrowth(g)
        if (h) setHealthDist(h)
      }
    } catch {
      // Fail gracefully
    } finally {
      setLoadingGrowth(false)
    }
  }, [])

  const refresh = React.useCallback(async () => {
    setLastRefresh(new Date())
    await Promise.all([fetchHealth(), fetchWebhooks(), fetchGrowth()])
    toast({ title: "Refreshed", variant: "success" })
  }, [fetchHealth, fetchWebhooks, fetchGrowth])

  React.useEffect(() => {
    void Promise.all([fetchHealth(), fetchWebhooks(), fetchGrowth()])
  }, [fetchHealth, fetchWebhooks, fetchGrowth])

  const runJob = React.useCallback(async (jobName: string) => {
    if (runningJob) return
    setRunningJob(jobName)
    try {
      const res = await fetch("/api/jobs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: jobName }),
      })
      const data = await res.json() as { ok: boolean; error?: string }
      if (data.ok) {
        toast({ title: `${JOB_LABELS[jobName] ?? jobName} completed`, variant: "success" })
        void fetchGrowth()
      } else {
        toast({ title: `Job failed: ${data.error ?? "unknown error"}`, variant: "error" })
      }
    } catch {
      toast({ title: "Failed to run job", variant: "error" })
    } finally {
      setRunningJob(null)
    }
  }, [runningJob, fetchGrowth])

  const isHealthy = health?.status === "healthy"
  const failedWebhooks = webhooks.filter(w => w.status === "failed" || w.status === "dead")
  const deadWebhooks   = webhooks.filter(w => w.status === "dead")

  const statCards: StatCard[] = [
    {
      label: "System Health",
      value: loadingHealth ? "…" : isHealthy ? "Healthy" : "Degraded",
      icon: <Activity className={cn("h-4 w-4", isHealthy ? "text-brand-green" : "text-red-400")} />,
      status: loadingHealth ? undefined : isHealthy ? "ok" : "error",
    },
    {
      label: "Failed Webhooks",
      value: failedWebhooks.length,
      sub: `${deadWebhooks.length} dead-lettered`,
      icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
      status: deadWebhooks.length > 0 ? "error" : failedWebhooks.length > 0 ? "warn" : "ok",
    },
    {
      label: "Total Creators",
      value: loadingGrowth ? "…" : (growth?.totalCreators ?? "—"),
      sub: growth ? `${growth.newCreators30d} new this month` : undefined,
      icon: <Users className="h-4 w-4 text-white/40" />,
    },
    {
      label: "Live Storefronts",
      value: loadingGrowth ? "…" : (growth?.publishedCreators ?? "—"),
      sub: growth ? `${growth.creatorsWithSales} with sales` : undefined,
      icon: <Target className="h-4 w-4 text-brand-green" />,
      status: "ok",
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Operations</h1>
          <p className="text-white/40 text-sm mt-1">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white/70 hover:text-white transition-all border border-white/10"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <StatCardItem key={card.label} card={card} />
        ))}
      </div>

      {/* Growth funnel + health distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Creator funnel */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-white/40" />
            <h2 className="font-semibold text-white">Creator Funnel</h2>
          </div>
          {loadingGrowth ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-8 rounded-lg bg-white/5 animate-pulse" />)}
            </div>
          ) : growth ? (
            <div className="space-y-3">
              {[
                { label: "Signed up", value: growth.totalCreators, pct: 100 },
                { label: "Added products", value: growth.creatorsWithProducts, pct: growth.totalCreators ? Math.round(growth.creatorsWithProducts / growth.totalCreators * 100) : 0 },
                { label: "Published store", value: growth.publishedCreators, pct: growth.totalCreators ? Math.round(growth.publishedCreators / growth.totalCreators * 100) : 0 },
                { label: "Made a sale", value: growth.creatorsWithSales, pct: growth.totalCreators ? Math.round(growth.creatorsWithSales / growth.totalCreators * 100) : 0 },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60">{row.label}</span>
                    <span className="text-white font-medium">{row.value} <span className="text-white/30">({row.pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-purple rounded-full transition-all"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/30 text-center py-4">No data available</p>
          )}
        </div>

        {/* Health distribution */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-4 w-4 text-white/40" />
            <h2 className="font-semibold text-white">Creator Health</h2>
            {healthDist && (
              <span className="ml-auto text-xs text-white/30">
                avg score: <span className="text-white/60">{healthDist.avgScore}</span>
              </span>
            )}
          </div>
          {loadingGrowth ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />)}
            </div>
          ) : healthDist && healthDist.totalScored > 0 ? (
            <div className="space-y-3">
              {[
                { label: "Healthy", value: healthDist.healthy, color: "bg-brand-green", textColor: "text-brand-green" },
                { label: "At risk", value: healthDist.atRisk, color: "bg-amber-400", textColor: "text-amber-400" },
                { label: "Churned", value: healthDist.churned, color: "bg-red-500", textColor: "text-red-400" },
              ].map(row => {
                const pct = Math.round(row.value / healthDist.totalScored * 100)
                return (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{row.label}</span>
                      <span className={cn("font-medium", row.textColor)}>{row.value} <span className="text-white/30">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", row.color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-white/25 pt-1">{healthDist.totalScored} creators scored</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-white/30">No health scores yet</p>
              <p className="text-xs text-white/20 mt-1">Run health scoring job to populate</p>
            </div>
          )}
        </div>
      </div>

      {/* System health checks */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-white/40" />
          <h2 className="font-semibold text-white">System Checks</h2>
          {!loadingHealth && health && (
            <span className={cn(
              "ml-auto text-xs font-medium px-2 py-0.5 rounded-full",
              isHealthy ? "bg-brand-green/15 text-brand-green" : "bg-red-500/15 text-red-400"
            )}>
              {health.status}
            </span>
          )}
        </div>

        {loadingHealth ? (
          <div className="space-y-2">
            {["env", "database", "webhooks", "ai", "payments"].map(k => (
              <div key={k} className="h-9 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : health ? (
          <div>
            <CheckRow label="Environment Variables" check={health.checks.env} />
            <CheckRow label="Database Connectivity" check={health.checks.database} />
            <CheckRow label="Webhook Queue" check={health.checks.webhooks} />
            <CheckRow label="AI (Anthropic)" check={health.checks.ai} />
            <CheckRow label="Payments (Paystack)" check={health.checks.payments} />
          </div>
        ) : (
          <p className="text-sm text-white/30 text-center py-4">Health data unavailable</p>
        )}
      </div>

      {/* Job runner */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Play className="h-4 w-4 text-white/40" />
          <h2 className="font-semibold text-white">Background Jobs</h2>
          {runningJob && (
            <span className="ml-auto text-xs text-amber-400 animate-pulse">
              Running {JOB_LABELS[runningJob] ?? runningJob}…
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(JOB_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => void runJob(key)}
              disabled={!!runningJob}
              className={cn(
                "flex flex-col items-start gap-1 px-3 py-3 rounded-xl border border-white/8 text-left transition-all",
                runningJob === key
                  ? "bg-amber-400/10 border-amber-400/30"
                  : "bg-white/3 hover:bg-white/8 hover:border-white/20",
                runningJob && runningJob !== key ? "opacity-40 cursor-not-allowed" : ""
              )}
            >
              <div className="flex items-center gap-1.5">
                <Play className={cn("h-3 w-3", runningJob === key ? "text-amber-400" : "text-white/30")} />
                <span className={cn("text-xs font-medium", runningJob === key ? "text-amber-400" : "text-white/70")}>
                  {label}
                </span>
              </div>
              <span className="text-[10px] text-white/25">{key}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Webhook event log */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-4 w-4 text-white/40" />
          <h2 className="font-semibold text-white">Webhook Events</h2>
          {failedWebhooks.length > 0 && (
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
              {failedWebhooks.length} need attention
            </span>
          )}
        </div>

        {loadingWebhooks ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-8 w-8 text-brand-green/40 mx-auto mb-2" />
            <p className="text-sm text-white/30">No webhook events recorded</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {webhooks.slice(0, 50).map(wh => (
              <div
                key={wh.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/3 transition-colors"
              >
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full flex-shrink-0",
                  wh.status === "processed" ? "bg-brand-green" :
                  wh.status === "dead" ? "bg-red-500" :
                  wh.status === "failed" ? "bg-amber-400" : "bg-white/30"
                )} />
                <span className="text-xs text-white/40 w-20 flex-shrink-0 font-mono">{wh.source}</span>
                <span className="text-sm text-white/70 flex-1 truncate">{wh.event_type}</span>
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0",
                  STATUS_COLOR[wh.status] ?? "text-white/40 bg-white/5"
                )}>
                  {wh.status}
                </span>
                {wh.attempt_count > 1 && (
                  <span className="text-[10px] text-white/30 flex-shrink-0">
                    ×{wh.attempt_count}
                  </span>
                )}
                <span className="text-[10px] text-white/25 flex-shrink-0">
                  {new Date(wh.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "AI Usage",       href: "/dashboard/analytics", icon: <Zap className="h-4 w-4" /> },
          { label: "Orders",         href: "/dashboard/orders",    icon: <CreditCard className="h-4 w-4" /> },
          { label: "WhatsApp",       href: "/dashboard/analytics", icon: <MessageCircle className="h-4 w-4" /> },
          { label: "Integrations",   href: "/dashboard/integrations", icon: <TrendingUp className="h-4 w-4" /> },
        ].map(link => (
          <a
            key={link.label}
            href={link.href}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 text-sm text-white/60 hover:text-white transition-all"
          >
            <span className="text-white/30">{link.icon}</span>
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}
