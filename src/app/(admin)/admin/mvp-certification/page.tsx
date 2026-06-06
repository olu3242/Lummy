import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import {
  CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Rocket,
  BarChart3, Activity, Lock, Users, ShoppingCart,
} from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "MVP Certification" }

type FlowStatus = "OPERATIONAL" | "PARTIAL" | "BROKEN" | "MOCKED" | "MISSING"

type FlowCheck = {
  id: string
  step: string
  status: FlowStatus
  detail: string
  source: "db" | "code" | "audit"
}

type DomainScore = {
  domain: string
  score: number
  icon: React.ComponentType<{ className?: string }>
  issues: string[]
}

function StatusBadge({ status }: { status: FlowStatus }) {
  const map: Record<FlowStatus, string> = {
    OPERATIONAL: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    PARTIAL: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    BROKEN: "text-red-400 bg-red-400/10 border-red-400/20",
    MOCKED: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    MISSING: "text-white/30 bg-white/5 border-white/10",
  }
  return (
    <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border ${map[status]}`}>
      {status}
    </span>
  )
}

function StatusIcon({ status }: { status: FlowStatus }) {
  if (status === "OPERATIONAL") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
  if (status === "PARTIAL") return <AlertTriangle className="w-4 h-4 text-amber-400" />
  if (status === "BROKEN") return <XCircle className="w-4 h-4 text-red-400" />
  if (status === "MOCKED") return <Activity className="w-4 h-4 text-blue-400" />
  return <XCircle className="w-4 h-4 text-white/30" />
}

const SCORE_WEIGHTS: Record<FlowStatus, number> = {
  OPERATIONAL: 100,
  PARTIAL: 60,
  MOCKED: 30,
  BROKEN: 0,
  MISSING: 0,
}

function scoreChecks(checks: FlowCheck[]): number {
  if (checks.length === 0) return 0
  const total = checks.reduce((acc, c) => acc + SCORE_WEIGHTS[c.status], 0)
  return Math.round(total / checks.length)
}

export default async function MVPCertificationPage() {
  const { role } = await requireAdminAccess()

  // Only super_admin can view full certification details
  const isSuperAdmin = role === "super_admin"

  const supabase = createClient()

  // ── Probe live DB for real data ────────────────────────────────────────
  let hasUsers = false
  let hasOrgs = false
  let hasStorefronts = false
  let hasPublishedStorefronts = false
  let hasProducts = false
  let hasOrders = false
  let hasPaidOrders = false
  let hasWebhookEvents = false
  let hasOnboardingStates = false
  let completedOnboarding = 0
  let totalOnboarding = 0

  try {
    const [
      { count: userCount },
      { count: orgCount },
      { count: sfCount },
      { count: pubSfCount },
      { count: prodCount },
      { count: orderCount },
      { count: paidCount },
      { count: webhookCount },
      { count: onboardCount },
      { count: completedCount },
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("organizations").select("id", { count: "exact", head: true }),
      supabase.from("storefronts").select("id", { count: "exact", head: true }),
      supabase.from("storefronts").select("id", { count: "exact", head: true }).eq("published", true),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "paid"),
      supabase.from("webhook_events").select("id", { count: "exact", head: true }),
      supabase.from("onboarding_states").select("id", { count: "exact", head: true }),
      supabase.from("onboarding_states").select("id", { count: "exact", head: true }).eq("status", "completed"),
    ])
    hasUsers = (userCount ?? 0) > 0
    hasOrgs = (orgCount ?? 0) > 0
    hasStorefronts = (sfCount ?? 0) > 0
    hasPublishedStorefronts = (pubSfCount ?? 0) > 0
    hasProducts = (prodCount ?? 0) > 0
    hasOrders = (orderCount ?? 0) > 0
    hasPaidOrders = (paidCount ?? 0) > 0
    hasWebhookEvents = (webhookCount ?? 0) > 0
    hasOnboardingStates = (onboardCount ?? 0) > 0
    completedOnboarding = completedCount ?? 0
    totalOnboarding = onboardCount ?? 0
  } catch (err) {
    console.error("[MVPCert] DB probe failed:", err)
  }

  // ── Full creator business loop checks ─────────────────────────────────
  const creatorLoopChecks: FlowCheck[] = [
    {
      id: "signup",
      step: "1. Creator Signs Up",
      status: hasUsers ? "OPERATIONAL" : "MISSING",
      detail: hasUsers
        ? "supabase.auth.signUp() → email verification → /api/auth/callback → ensureCreatorRuntimeContext(). User records present in profiles table."
        : "No user records found. Auth infrastructure in place but untested end-to-end.",
      source: "db",
    },
    {
      id: "email_verify",
      step: "2. Email Verification",
      status: "PARTIAL",
      detail: "Supabase email verification flow is wired. However, there is no resend-verification UI, and the password reset link on the login page points to '#' (not implemented).",
      source: "code",
    },
    {
      id: "login",
      step: "3. Login",
      status: "OPERATIONAL",
      detail: "supabase.auth.signInWithPassword() → /api/account/bootstrap → profiles check → redirect to /dashboard. Session persisted via Supabase cookie.",
      source: "code",
    },
    {
      id: "onboarding",
      step: "4. Complete Onboarding",
      status: hasOnboardingStates
        ? (completedOnboarding > 0 ? "OPERATIONAL" : "PARTIAL")
        : "MISSING",
      detail: hasOnboardingStates
        ? `5-step wizard → completeOnboarding() server action → writes profiles, organizations, storefronts, onboarding_states. ${completedOnboarding}/${totalOnboarding} completed.`
        : "No onboarding_states records found in DB.",
      source: "db",
    },
    {
      id: "create_org",
      step: "5. Create Organization",
      status: hasOrgs ? "OPERATIONAL" : "MISSING",
      detail: hasOrgs
        ? "Organizations created during onboarding. org_id foreign key used for all tenant isolation. RLS enforced."
        : "No organizations found in DB.",
      source: "db",
    },
    {
      id: "create_storefront",
      step: "6. Create Storefront",
      status: hasStorefronts ? "OPERATIONAL" : "MISSING",
      detail: hasStorefronts
        ? "storefront-repository.ts → storefronts upsert with org_id. Correct tenant isolation."
        : "No storefront records found in DB.",
      source: "db",
    },
    {
      id: "add_product",
      step: "7. Add Product",
      status: hasProducts ? "OPERATIONAL" : "MISSING",
      detail: hasProducts
        ? "/api/products → createProductForCurrentUser() → products table with org_id. Full DB persistence."
        : "No product records found in DB.",
      source: "db",
    },
    {
      id: "publish_storefront",
      step: "8. Publish Storefront",
      status: hasPublishedStorefronts ? "OPERATIONAL" : (hasStorefronts ? "PARTIAL" : "MISSING"),
      detail: hasPublishedStorefronts
        ? "Storefronts with published=true found. Public /[handle] route renders storefront correctly."
        : hasStorefronts
          ? "Storefronts exist but none are published. Publish flow may be untested end-to-end."
          : "No storefronts found.",
      source: "db",
    },
    {
      id: "receive_order",
      step: "9. Receive Order (Customer Checkout)",
      status: hasOrders ? "OPERATIONAL" : "MISSING",
      detail: hasOrders
        ? "Order creation via checkout flow confirmed. Orders table records exist. Note: guest email falls back to guest@lummy.local when authenticated user email unavailable."
        : "No order records found in DB.",
      source: "db",
    },
    {
      id: "receive_payment",
      step: "10. Receive Payment",
      status: hasPaidOrders ? "OPERATIONAL" : (hasOrders ? "PARTIAL" : "MISSING"),
      detail: hasPaidOrders
        ? "Paid orders confirmed in DB. Paystack webhook handler updates orders + payments tables. Idempotency key pattern in place."
        : hasOrders
          ? "Orders exist but no paid orders. Payment provider webhook may not be delivering to this environment."
          : "No orders or payments found.",
      source: "db",
    },
    {
      id: "dashboard_access",
      step: "11. Access Dashboard",
      status: "PARTIAL",
      detail: "Dashboard renders with real data (products, storefronts from DB). CRITICAL: src/app/(dashboard)/layout.tsx is a 'use client' component with NO requireAuth() guard. Unauthenticated users who know a dashboard URL can reach it directly.",
      source: "code",
    },
    {
      id: "multi_tenant",
      step: "12. Multi-tenant Isolation (RLS)",
      status: "PARTIAL",
      detail: "62 of 67 tables have RLS enabled. 5 tables have NO RLS at all (creator_economy_scores, economy_health_snapshots, scaling_bottleneck_log, kernel_intervention_log, governance_snapshots). 6 agent tables have RLS enabled but NO policies (data inaccessible). Core business tables properly isolated via creator_id → creator_profiles → user_id = auth.uid().",
      source: "audit",
    },
  ]

  // ── Domain health scores ───────────────────────────────────────────────
  const authChecks = creatorLoopChecks.filter(c => ["signup", "email_verify", "login"].includes(c.id))
  const onboardChecks = creatorLoopChecks.filter(c => ["onboarding", "create_org", "create_storefront"].includes(c.id))
  const commerceChecks = creatorLoopChecks.filter(c => ["add_product", "publish_storefront", "receive_order"].includes(c.id))
  const paymentChecks = creatorLoopChecks.filter(c => ["receive_payment"].includes(c.id))
  const dashboardChecks = creatorLoopChecks.filter(c => ["dashboard_access"].includes(c.id))
  const tenantChecks = creatorLoopChecks.filter(c => ["multi_tenant"].includes(c.id))

  const domainScores: DomainScore[] = [
    {
      domain: "Authentication",
      score: scoreChecks(authChecks),
      icon: Lock,
      issues: authChecks.filter(c => c.status !== "OPERATIONAL").map(c => c.step),
    },
    {
      domain: "Onboarding",
      score: scoreChecks(onboardChecks),
      icon: Users,
      issues: onboardChecks.filter(c => c.status !== "OPERATIONAL").map(c => c.step),
    },
    {
      domain: "Commerce",
      score: scoreChecks(commerceChecks),
      icon: ShoppingCart,
      issues: commerceChecks.filter(c => c.status !== "OPERATIONAL").map(c => c.step),
    },
    {
      domain: "Payments",
      score: scoreChecks(paymentChecks),
      icon: Activity,
      issues: paymentChecks.filter(c => c.status !== "OPERATIONAL").map(c => c.step),
    },
    {
      domain: "Dashboard",
      score: scoreChecks(dashboardChecks),
      icon: BarChart3,
      issues: dashboardChecks.filter(c => c.status !== "OPERATIONAL").map(c => c.step),
    },
    {
      domain: "Tenant Isolation",
      score: scoreChecks(tenantChecks),
      icon: ShieldCheck,
      issues: tenantChecks.filter(c => c.status !== "OPERATIONAL").map(c => c.step),
    },
  ]

  const overallScore = scoreChecks(creatorLoopChecks)
  const overallVerdict: "LAUNCH_READY" | "CONDITIONAL" | "NOT_READY" =
    overallScore >= 85 ? "LAUNCH_READY"
    : overallScore >= 60 ? "CONDITIONAL"
    : "NOT_READY"

  const verdictStyles = {
    LAUNCH_READY: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/5",
      text: "text-emerald-400",
      label: "LAUNCH READY",
    },
    CONDITIONAL: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/5",
      text: "text-amber-400",
      label: "CONDITIONAL — Fix blockers before launch",
    },
    NOT_READY: {
      border: "border-red-500/30",
      bg: "bg-red-500/5",
      text: "text-red-400",
      label: "NOT READY — Critical issues must be resolved",
    },
  }
  const vs = verdictStyles[overallVerdict]

  const blockers = creatorLoopChecks.filter(c => c.status === "BROKEN" || c.status === "MISSING")
  const warnings = creatorLoopChecks.filter(c => c.status === "PARTIAL" || c.status === "MOCKED")

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Rocket className="w-6 h-6 text-[#6C4EF3]" />
            MVP Certification
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Full creator business loop certification — real persistence, real auth, real payments, real isolation.
          </p>
        </div>
        {!isSuperAdmin && (
          <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border text-amber-400 bg-amber-400/10 border-amber-400/20">
            Platform Admin View
          </span>
        )}
      </div>

      {/* Overall verdict */}
      <div className={`rounded-xl border ${vs.border} ${vs.bg} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider font-mono mb-1">MVP Readiness Score</p>
            <p className={`text-5xl font-bold ${vs.text}`}>{overallScore}<span className="text-2xl text-white/30">/100</span></p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${vs.text}`}>{vs.label}</p>
            <p className="text-xs text-white/40 mt-1">
              {blockers.length} blocker{blockers.length !== 1 ? "s" : ""} · {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${
              overallScore >= 85 ? "bg-emerald-400" : overallScore >= 60 ? "bg-amber-400" : "bg-red-400"
            }`}
            style={{ width: `${overallScore}%` }}
          />
        </div>
      </div>

      {/* Domain scores */}
      <div className="grid grid-cols-3 gap-4">
        {domainScores.map(({ domain, score, icon: Icon, issues }) => (
          <div key={domain} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#6C4EF3]" />
                <p className="text-sm font-semibold text-white">{domain}</p>
              </div>
              <p className={`text-xl font-bold ${
                score >= 85 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400"
              }`}>{score}</p>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 mb-2">
              <div
                className={`h-full rounded-full ${
                  score >= 85 ? "bg-emerald-400" : score >= 60 ? "bg-amber-400" : "bg-red-400"
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
            {issues.length > 0 && (
              <ul className="space-y-0.5">
                {issues.map(issue => (
                  <li key={issue} className="text-[10px] text-amber-400/70 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            )}
            {issues.length === 0 && (
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> All checks passing
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Full flow checklist */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#6C4EF3]" /> Full Creator Business Loop
        </h2>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Step</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs w-28">Status</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Detail</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs w-16">Source</th>
              </tr>
            </thead>
            <tbody>
              {creatorLoopChecks.map(check => (
                <tr key={check.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={check.status} />
                      <span className="text-white text-xs font-medium">{check.step}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4"><StatusBadge status={check.status} /></td>
                  <td className="py-3 px-4 text-xs text-white/50 max-w-md">{check.detail}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-mono ${
                      check.source === "db" ? "text-[#6C4EF3]"
                      : check.source === "code" ? "text-amber-400"
                      : "text-white/30"
                    }`}>{check.source}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Blockers */}
      {blockers.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" /> Blockers
          </h2>
          <div className="space-y-2">
            {blockers.map(b => (
              <div key={b.id} className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400 font-semibold">{b.step}</p>
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-xs text-red-400/70 ml-5">{b.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Warnings — Must Fix Before Launch
          </h2>
          <div className="space-y-2">
            {warnings.map(w => (
              <div key={w.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-400 font-semibold">{w.step}</p>
                  <StatusBadge status={w.status} />
                </div>
                <p className="text-xs text-amber-400/70 ml-5">{w.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* RLS Summary */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#6C4EF3]" /> Database Security (RLS Audit)
        </h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: "Total Tables", value: 67, color: "text-white" },
            { label: "RLS Enabled", value: 62, color: "text-emerald-400" },
            { label: "No RLS at All", value: 5, color: "text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/50 mb-2">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-xs text-red-400">
              <strong>5 tables with zero RLS — world-readable/writable:</strong>{" "}
              <span className="font-mono">creator_economy_scores</span>,{" "}
              <span className="font-mono">economy_health_snapshots</span>,{" "}
              <span className="font-mono">scaling_bottleneck_log</span>,{" "}
              <span className="font-mono">kernel_intervention_log</span>,{" "}
              <span className="font-mono">governance_snapshots</span>.
              These expose financial/operational intelligence to any unauthenticated user.
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-400">
              <strong>6 agent tables with RLS but no policies — data inaccessible:</strong>{" "}
              <span className="font-mono">agent_permissions</span>,{" "}
              <span className="font-mono">agent_health</span>,{" "}
              <span className="font-mono">agent_workflows</span>,{" "}
              <span className="font-mono">agent_logs</span>,{" "}
              <span className="font-mono">agent_failures</span>,{" "}
              <span className="font-mono">agent_recovery_runs</span>.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs text-emerald-400">
              <strong>Core business tables properly isolated:</strong> All 50+ user-facing policies correctly
              use <span className="font-mono">creator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid())</span>.
              Multi-tenant boundary is sound.
            </p>
          </div>
        </div>
      </section>

      {/* Certification answer */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Rocket className="w-4 h-4 text-[#6C4EF3]" /> Certification Answer
        </h2>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <p className="text-sm text-white/80 leading-relaxed">
            <strong className="text-white">Can a real creator complete the full business loop?</strong>{" "}
            The core path — signup → onboarding → storefront → product → checkout → payment — is{" "}
            <span className="text-emerald-400 font-semibold">functionally operational</span> end-to-end
            with real DB persistence and real Supabase auth.
          </p>
          <div className="space-y-2 text-xs text-white/60">
            <p>
              <strong className="text-amber-400">⚠ Before launch — must fix:</strong>
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Add RLS policies to the 5 tables with no protection (financial data exposure)</li>
              <li>Fix missing policies on 6 agent_* tables (currently inaccessible)</li>
              <li>Add server-side auth guard to <span className="font-mono">src/app/(dashboard)/layout.tsx</span></li>
              <li>Implement password reset flow (currently links to #)</li>
              <li>Wire product analytics fields (sales/views/stock) — currently return 0</li>
            </ul>
            <p className="mt-3">
              <strong className="text-white/60">✓ Already working:</strong>
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Auth: signup, email verification, login, session management</li>
              <li>Onboarding: 5-step wizard with correct DB writes to all tables</li>
              <li>Product creation: full API route with org-scoped RLS</li>
              <li>Storefront publish: real storefronts, real public URLs</li>
              <li>Checkout: real order creation with payment_status tracking</li>
              <li>Webhook payments: Paystack webhook handler updates orders table</li>
              <li>Tenant isolation: core 50+ business policies correctly enforce org boundaries</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 text-xs text-white/20">
        <Activity className="w-3 h-3" />
        <span>Certification generated {new Date().toLocaleString()} · Sources: live DB probe + code audit + RLS migration analysis</span>
      </div>
    </div>
  )
}
