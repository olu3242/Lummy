import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import {
  UserCheck, Store, Package, CheckCircle2, XCircle,
  Clock, TrendingDown, ArrowRight, AlertTriangle,
} from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Onboarding Center" }

type FunnelStep = {
  label: string
  count: number
  icon: React.ComponentType<{ className?: string }>
}

type DropStep = {
  from: string
  to: string
  entered: number
  completed: number
  dropRate: number
}

export default async function OnboardingCenterPage() {
  await requireAdminAccess()
  const supabase = createClient()

  // ── Step counts ─────────────────────────────────────────────────────────
  let totalProfiles = 0
  let totalOrgs = 0
  let totalStorefronts = 0
  let publishedStorefronts = 0
  let totalProducts = 0
  let completedOnboarding = 0
  let startedOnboarding = 0
  let failedOnboarding = 0

  try {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
    totalProfiles = count ?? 0
  } catch (err) {
    console.error("[OnboardingCenter] profiles count failed:", err)
  }

  try {
    const { count } = await supabase
      .from("organizations")
      .select("id", { count: "exact", head: true })
    totalOrgs = count ?? 0
  } catch (err) {
    console.error("[OnboardingCenter] organizations count failed:", err)
  }

  try {
    const { count: sfCount } = await supabase
      .from("storefronts")
      .select("id", { count: "exact", head: true })
    totalStorefronts = sfCount ?? 0

    const { count: pubCount } = await supabase
      .from("storefronts")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
    publishedStorefronts = pubCount ?? 0
  } catch (err) {
    console.error("[OnboardingCenter] storefronts count failed:", err)
  }

  try {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
    totalProducts = count ?? 0
  } catch (err) {
    console.error("[OnboardingCenter] products count failed:", err)
  }

  try {
    const { count: compCount } = await supabase
      .from("onboarding_states")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
    completedOnboarding = compCount ?? 0

    const { count: startCount } = await supabase
      .from("onboarding_states")
      .select("id", { count: "exact", head: true })
    startedOnboarding = startCount ?? 0

    const { count: failCount } = await supabase
      .from("onboarding_states")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
    failedOnboarding = failCount ?? 0
  } catch (err) {
    console.error("[OnboardingCenter] onboarding_states query failed:", err)
  }

  // ── Abandoned = started onboarding but no org created ──────────────────
  const abandonedOnboarding = Math.max(0, startedOnboarding - completedOnboarding - failedOnboarding)
  const completionRate = startedOnboarding > 0
    ? Math.round((completedOnboarding / startedOnboarding) * 100)
    : 0

  // ── Recent incomplete onboarding ──────────────────────────────────────
  let recentIncomplete: Array<{
    id: string; userId: string; currentStep: string; status: string; updatedAt: string
  }> = []
  try {
    const { data } = await supabase
      .from("onboarding_states")
      .select("id, user_id, current_step, status, updated_at")
      .neq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(10)
    if (data) {
      recentIncomplete = data.map((r: {
        id: string; user_id: string; current_step?: string; status?: string; updated_at: string
      }) => ({
        id: r.id,
        userId: r.user_id,
        currentStep: r.current_step ?? "unknown",
        status: r.status ?? "unknown",
        updatedAt: r.updated_at,
      }))
    }
  } catch (err) {
    console.error("[OnboardingCenter] recent incomplete query failed:", err)
  }

  // ── Funnel steps ───────────────────────────────────────────────────────
  const funnelSteps: FunnelStep[] = [
    { label: "Signed Up", count: totalProfiles, icon: UserCheck },
    { label: "Organization Created", count: totalOrgs, icon: CheckCircle2 },
    { label: "Storefront Created", count: totalStorefronts, icon: Store },
    { label: "Product Added", count: totalProducts > 0 ? Math.min(totalStorefronts, totalProducts) : 0, icon: Package },
    { label: "Storefront Published", count: publishedStorefronts, icon: CheckCircle2 },
  ]

  const drops: DropStep[] = []
  for (let i = 0; i < funnelSteps.length - 1; i++) {
    const from = funnelSteps[i]
    const to = funnelSteps[i + 1]
    if (from.count > 0) {
      drops.push({
        from: from.label,
        to: to.label,
        entered: from.count,
        completed: to.count,
        dropRate: Math.round(((from.count - to.count) / from.count) * 100),
      })
    }
  }

  const biggestDrop = drops.reduce<DropStep | null>((acc, d) => {
    if (!acc || d.dropRate > acc.dropRate) return d
    return acc
  }, null)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-[#6C4EF3]" />
          Onboarding Center
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Creator onboarding funnel — from signup to first published storefront.
        </p>
      </div>

      {biggestDrop && biggestDrop.dropRate > 50 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
          <TrendingDown className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">
            Largest drop-off: <strong>{biggestDrop.from} → {biggestDrop.to}</strong> with{" "}
            <strong>{biggestDrop.dropRate}%</strong> abandonment. Investigate UX friction at this step.
          </p>
        </div>
      )}

      {/* KPI summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Started Onboarding", value: startedOnboarding, color: "text-white" },
          { label: "Completed", value: completedOnboarding, color: "text-emerald-400" },
          { label: "Abandoned", value: abandonedOnboarding, color: abandonedOnboarding > 0 ? "text-amber-400" : "text-white/30" },
          { label: "Failed", value: failedOnboarding, color: failedOnboarding > 0 ? "text-red-400" : "text-white/30" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50 mb-2">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Completion rate */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Onboarding Completion Rate</p>
          <p className="text-2xl font-bold text-white">{completionRate}%</p>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#6C4EF3]"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-xs text-white/30 mt-2">
          {completedOnboarding} fully completed of {startedOnboarding} who started
        </p>
      </div>

      {/* Funnel visualization */}
      <section>
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-[#6C4EF3]" /> Funnel Steps
        </h2>
        <div className="space-y-2">
          {funnelSteps.map((step, i) => {
            const pct = funnelSteps[0].count > 0
              ? Math.round((step.count / funnelSteps[0].count) * 100)
              : 0
            const { icon: Icon } = step
            return (
              <div key={step.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-4">
                  <div className="w-6 text-center text-xs text-white/30 font-mono">{i + 1}</div>
                  <Icon className="w-4 h-4 text-[#6C4EF3] shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm text-white">{step.label}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/40">{pct}% of signups</span>
                        <span className="text-base font-bold text-white">{step.count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#6C4EF3]/60"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
                {i < funnelSteps.length - 1 && drops[i] && drops[i].dropRate > 0 && (
                  <div className="ml-10 mt-2 flex items-center gap-1.5 text-[10px]">
                    <TrendingDown className={`w-3 h-3 ${drops[i].dropRate > 50 ? "text-red-400" : "text-amber-400"}`} />
                    <span className={drops[i].dropRate > 50 ? "text-red-400" : "text-amber-400"}>
                      {drops[i].dropRate}% drop-off to next step
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Recent incomplete sessions */}
      {recentIncomplete.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Recently Stuck / Incomplete
          </h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left py-3 px-4 text-white/50 font-medium">User ID</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Current Step</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {recentIncomplete.map(row => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-white/40 text-[10px]">{row.userId.slice(0, 12)}…</td>
                    <td className="py-2.5 px-4 text-white/70 font-mono text-[10px]">{row.currentStep}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border ${
                        row.status === "failed"
                          ? "text-red-400 bg-red-400/10 border-red-400/20"
                          : "text-amber-400 bg-amber-400/10 border-amber-400/20"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-white/40">{new Date(row.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Known issues */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Known Onboarding Issues
        </h2>
        <div className="space-y-2">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs text-emerald-400">
              <strong>5-step wizard:</strong> Operational — completeOnboarding() server action writes profiles,
              organizations, storefronts, and onboarding_states correctly.
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-400">
              <strong>Email verification gate:</strong> Signup flow requires email verification before dashboard access,
              but there is no resend-verification UI path for users who miss the email.
            </p>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-xs text-red-400">
              <strong>Dashboard layout auth:</strong>{" "}
              <span className="font-mono">src/app/(dashboard)/layout.tsx</span> is a client component with no server-side
              auth guard. A user who navigates directly to <span className="font-mono">/dashboard</span> without completing
              onboarding may reach the shell without authentication.
            </p>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 text-xs text-white/20">
        <XCircle className="w-3 h-3" />
        <span>Sources: <span className="font-mono">profiles</span>, <span className="font-mono">organizations</span>, <span className="font-mono">storefronts</span>, <span className="font-mono">products</span>, <span className="font-mono">onboarding_states</span></span>
      </div>
    </div>
  )
}
