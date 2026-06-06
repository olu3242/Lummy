import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import {
  ShieldCheck, ShieldAlert, UserPlus, LogIn, LogOut,
  Mail, AlertTriangle, Activity, RefreshCw, Lock,
} from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Auth Center" }

type AuthEvent = {
  type: string
  count: number
  lastSeen: string | null
}

function HealthBadge({ status }: { status: "healthy" | "degraded" | "critical" }) {
  if (status === "healthy") return (
    <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border text-emerald-400 bg-emerald-400/10 border-emerald-400/20">Healthy</span>
  )
  if (status === "degraded") return (
    <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border text-amber-400 bg-amber-400/10 border-amber-400/20">Degraded</span>
  )
  return (
    <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border text-red-400 bg-red-400/10 border-red-400/20">Critical</span>
  )
}

export default async function AuthCenterPage() {
  await requireAdminAccess()
  const supabase = createClient()

  // ── User counts from profiles ──────────────────────────────────────────
  let totalUsers = 0
  let verifiedUsers = 0
  let unverifiedUsers = 0
  let recentSignups = 0

  try {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
    totalUsers = count ?? 0

    const { count: vCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("email_verified", true)
    verifiedUsers = vCount ?? 0

    unverifiedUsers = totalUsers - verifiedUsers

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: rCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since)
    recentSignups = rCount ?? 0
  } catch (err) {
    console.error("[AuthCenter] profiles query failed:", err)
  }

  // ── Auth events from events table ──────────────────────────────────────
  let authEvents: AuthEvent[] = []
  let failedLoginCount = 0
  let failedSignupCount = 0
  let sessionFailures = 0
  let oauthLogins = 0
  let passwordResets = 0

  try {
    const { data: events } = await supabase
      .from("events")
      .select("event_type, created_at")
      .in("event_type", [
        "auth.login.failed",
        "auth.signup.failed",
        "auth.session.failed",
        "auth.oauth.login",
        "auth.password_reset.requested",
        "auth.email.verified",
        "auth.logout",
        "auth.redirect_loop",
      ])
      .order("created_at", { ascending: false })
      .limit(500)

    if (events && events.length > 0) {
      const grouped: Record<string, { count: number; lastSeen: string | null }> = {}
      for (const e of events) {
        if (!grouped[e.event_type]) grouped[e.event_type] = { count: 0, lastSeen: null }
        grouped[e.event_type].count++
        if (!grouped[e.event_type].lastSeen) grouped[e.event_type].lastSeen = e.created_at
      }
      authEvents = Object.entries(grouped).map(([type, { count, lastSeen }]) => ({ type, count, lastSeen }))

      failedLoginCount = grouped["auth.login.failed"]?.count ?? 0
      failedSignupCount = grouped["auth.signup.failed"]?.count ?? 0
      sessionFailures = grouped["auth.session.failed"]?.count ?? 0
      oauthLogins = grouped["auth.oauth.login"]?.count ?? 0
      passwordResets = grouped["auth.password_reset.requested"]?.count ?? 0
    }
  } catch (err) {
    console.error("[AuthCenter] events query failed:", err)
  }

  // ── Determine health classification ───────────────────────────────────
  const failRate = totalUsers > 0 ? (failedLoginCount / Math.max(totalUsers, 1)) : 0
  const overallHealth: "healthy" | "degraded" | "critical" =
    failedLoginCount > 50 || sessionFailures > 20 ? "critical"
    : failedLoginCount > 10 || unverifiedUsers / Math.max(totalUsers, 1) > 0.5 ? "degraded"
    : "healthy"

  const providerChecks = [
    {
      name: "Email/Password",
      status: failedLoginCount < 10 ? "healthy" : failedLoginCount < 50 ? "degraded" : "critical" as "healthy" | "degraded" | "critical",
      detail: `${failedLoginCount} failed login${failedLoginCount !== 1 ? "s" : ""} detected`,
    },
    {
      name: "Email Verification",
      status: (unverifiedUsers / Math.max(totalUsers, 1)) < 0.3 ? "healthy" : "degraded" as "healthy" | "degraded" | "critical",
      detail: `${verifiedUsers} verified / ${totalUsers} total`,
    },
    {
      name: "OAuth (Social Login)",
      status: "healthy" as "healthy" | "degraded" | "critical",
      detail: `${oauthLogins} OAuth logins recorded`,
    },
    {
      name: "Password Reset",
      status: "degraded" as "healthy" | "degraded" | "critical",
      detail: "Reset flow not fully implemented (links to #)",
    },
    {
      name: "Session Management",
      status: sessionFailures > 10 ? "critical" : sessionFailures > 0 ? "degraded" : "healthy" as "healthy" | "degraded" | "critical",
      detail: `${sessionFailures} session failure event${sessionFailures !== 1 ? "s" : ""}`,
    },
  ]

  const EVENT_LABELS: Record<string, string> = {
    "auth.login.failed": "Failed Logins",
    "auth.signup.failed": "Failed Signups",
    "auth.session.failed": "Session Failures",
    "auth.oauth.login": "OAuth Logins",
    "auth.password_reset.requested": "Password Resets",
    "auth.email.verified": "Email Verifications",
    "auth.logout": "Logouts",
    "auth.redirect_loop": "Redirect Loop Events",
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#6C4EF3]" />
            Auth Center
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Platform authentication health — signups, verifications, sessions, OAuth, failures.
          </p>
        </div>
        <HealthBadge status={overallHealth} />
      </div>

      {overallHealth === "critical" && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">
            Auth system showing critical failure signals. Review Supabase Auth logs and provider configuration immediately.
          </p>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: totalUsers, icon: UserPlus, color: "text-white" },
          { label: "Email Verified", value: verifiedUsers, icon: Mail, color: "text-emerald-400" },
          { label: "Unverified", value: unverifiedUsers, icon: ShieldAlert, color: unverifiedUsers > 0 ? "text-amber-400" : "text-white/30" },
          { label: "New (7 days)", value: recentSignups, icon: Activity, color: "text-[#6C4EF3]" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/50">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Failure signals */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Failed Logins", value: failedLoginCount, icon: Lock, color: failedLoginCount > 0 ? "text-red-400" : "text-white/30" },
          { label: "Failed Signups", value: failedSignupCount, icon: ShieldAlert, color: failedSignupCount > 0 ? "text-amber-400" : "text-white/30" },
          { label: "Session Failures", value: sessionFailures, icon: RefreshCw, color: sessionFailures > 0 ? "text-red-400" : "text-white/30" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/50">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Auth provider health */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#6C4EF3]" /> Auth Provider Status
        </h2>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Provider</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Health</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Detail</th>
              </tr>
            </thead>
            <tbody>
              {providerChecks.map(({ name, status, detail }) => (
                <tr key={name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-medium text-white">{name}</td>
                  <td className="py-3 px-4"><HealthBadge status={status} /></td>
                  <td className="py-3 px-4 text-xs text-white/50">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Event log */}
      {authEvents.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#6C4EF3]" /> Auth Event Counts (last 500 events)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {authEvents.map(({ type, count, lastSeen }) => (
              <div key={type} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-white/60">{EVENT_LABELS[type] ?? type}</p>
                  {lastSeen && (
                    <p className="text-[10px] text-white/30 mt-0.5">
                      Last: {new Date(lastSeen).toLocaleString()}
                    </p>
                  )}
                </div>
                <p className={`text-2xl font-bold ${count > 0 && type.includes("failed") ? "text-red-400" : "text-white"}`}>
                  {count}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {authEvents.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
          <LogIn className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-sm text-white/40">No auth event records in events table.</p>
          <p className="text-xs text-white/20 mt-1">Check Supabase Auth dashboard for raw auth logs.</p>
        </div>
      )}

      {/* Known issues */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Known Auth Issues
        </h2>
        <div className="space-y-2">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-400">
              <strong>Password Reset:</strong> Login page links to{" "}
              <span className="font-mono">#</span> instead of a reset flow. Users cannot self-serve password recovery.
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-400">
              <strong>Dashboard Layout:</strong>{" "}
              <span className="font-mono">src/app/(dashboard)/layout.tsx</span> is a client component with no{" "}
              <span className="font-mono">requireAuth()</span> guard. Unauthenticated users who know the URL can
              reach dashboard routes directly.
            </p>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 text-xs text-white/20">
        <LogOut className="w-3 h-3" />
        <span>Sources: <span className="font-mono">profiles</span>, <span className="font-mono">events</span> — Supabase Auth logs not directly queryable via client.</span>
      </div>
    </div>
  )
}
