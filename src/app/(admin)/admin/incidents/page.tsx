import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { AlertTriangle, CheckCircle2, XCircle, Clock, Zap } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Incident Center" }

type IncidentStatus = "active" | "investigating" | "resolved"
type IncidentSeverity = "critical" | "high" | "medium" | "low"

type Incident = {
  id: string
  title: string
  status: IncidentStatus
  severity: IncidentSeverity
  category: string
  affectedServices: string[]
  detectedAt: string
  resolvedAt: string | null
  description: string
  source: "db" | "mock"
}

const CATEGORIES = ["All", "Authentication", "Onboarding", "Storefront", "Checkout", "Payments", "Email", "WhatsApp", "Webhooks"]

const SEVERITY_COLOR: Record<IncidentSeverity, string> = {
  critical: "text-red-400 bg-red-400/10 border-red-400/20",
  high: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  low: "text-blue-400 bg-blue-400/10 border-blue-400/20",
}

const STATUS_CONFIG: Record<IncidentStatus, { label: string; icon: React.ReactNode; color: string }> = {
  active: { label: "Active", icon: <XCircle className="w-3.5 h-3.5 text-red-400" />, color: "text-red-400" },
  investigating: { label: "Investigating", icon: <Clock className="w-3.5 h-3.5 text-amber-400" />, color: "text-amber-400" },
  resolved: { label: "Resolved", icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />, color: "text-emerald-400" },
}

async function detectIncidentsFromDB(supabase: ReturnType<typeof createClient>): Promise<Incident[]> {
  const incidents: Incident[] = []

  try {
    // Detect webhook failures from webhook_events table
    const { data: failedWebhooks, count: failedCount } = await supabase
      .from("webhook_events")
      .select("id, source, event_type, error_message, created_at", { count: "exact" })
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(5)

    if (failedCount && failedCount > 0) {
      const sources = [...new Set((failedWebhooks ?? []).map((w: { source: string }) => w.source))]
      incidents.push({
        id: "inc-webhook-failures",
        title: `${failedCount} failed webhook event${failedCount > 1 ? "s" : ""}`,
        status: failedCount > 5 ? "active" : "investigating",
        severity: failedCount > 10 ? "high" : "medium",
        category: "Webhooks",
        affectedServices: sources,
        detectedAt: (failedWebhooks?.[0] as { created_at: string })?.created_at ?? new Date().toISOString(),
        resolvedAt: null,
        description: `${failedCount} webhook events have failed processing. Latest from: ${sources.join(", ")}.`,
        source: "db",
      })
    }

    // Detect dead-letter jobs
    const { count: deadLetterCount } = await supabase
      .from("runtime_job_dead_letters")
      .select("id", { count: "exact", head: true })

    if (deadLetterCount && deadLetterCount > 0) {
      incidents.push({
        id: "inc-dead-letters",
        title: `${deadLetterCount} dead-letter job${deadLetterCount > 1 ? "s" : ""} accumulated`,
        status: "investigating",
        severity: deadLetterCount > 20 ? "high" : "medium",
        category: "Checkout",
        affectedServices: ["background-jobs"],
        detectedAt: new Date().toISOString(),
        resolvedAt: null,
        description: `${deadLetterCount} background jobs have permanently failed and require investigation.`,
        source: "db",
      })
    }

    // Detect agent failures
    const { count: agentFailureCount } = await supabase
      .from("agent_failures")
      .select("id", { count: "exact", head: true })

    if (agentFailureCount && agentFailureCount > 0) {
      incidents.push({
        id: "inc-agent-failures",
        title: `${agentFailureCount} agent failure${agentFailureCount > 1 ? "s" : ""} logged`,
        status: "investigating",
        severity: agentFailureCount > 10 ? "critical" : "high",
        category: "Onboarding",
        affectedServices: ["ai-agents", "onboarding"],
        detectedAt: new Date().toISOString(),
        resolvedAt: null,
        description: `${agentFailureCount} platform agents have recorded failures. May impact AI features and onboarding.`,
        source: "db",
      })
    }

    // Detect open high-priority support tickets as proxy for user-reported incidents
    const { data: criticalTickets, count: criticalCount } = await supabase
      .from("support_tickets")
      .select("id, title, created_at", { count: "exact" })
      .eq("priority", "high")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(3)

    if (criticalCount && criticalCount > 0) {
      incidents.push({
        id: "inc-critical-tickets",
        title: `${criticalCount} unresolved high-priority support ticket${criticalCount > 1 ? "s" : ""}`,
        status: "investigating",
        severity: "medium",
        category: "Payments",
        affectedServices: ["support", "creators"],
        detectedAt: (criticalTickets?.[0] as { created_at: string })?.created_at ?? new Date().toISOString(),
        resolvedAt: null,
        description: `${criticalCount} creator-reported issues require attention: ${(criticalTickets ?? []).map((t: { title: string }) => t.title).slice(0, 2).join("; ")}.`,
        source: "db",
      })
    }
  } catch (err) {
    console.error("[AdminIncidents] DB detection error:", err)
  }

  return incidents
}

export default async function IncidentsPage() {
  await requireAdminAccess()
  const supabase = createClient()

  const dbIncidents = await detectIncidentsFromDB(supabase)

  // If no DB incidents detected, show a "No active incidents" state — no fake mock data
  const activeIncidents = dbIncidents.filter(i => i.status !== "resolved")
  const resolvedIncidents = dbIncidents.filter(i => i.status === "resolved")
  const criticalCount = dbIncidents.filter(i => i.severity === "critical").length

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-[#6C4EF3]" />
          Incident Center
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Real-time operational issues detected from platform telemetry — webhook failures, job dead-letters, agent errors, critical tickets.
        </p>
      </div>

      {criticalCount > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-400">{criticalCount} critical incident{criticalCount > 1 ? "s" : ""} active</p>
            <p className="text-xs text-red-400/70 mt-0.5">Immediate platform-level attention required.</p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active incidents", value: activeIncidents.length, color: activeIncidents.length > 0 ? "text-red-400" : "text-emerald-400" },
          { label: "Critical", value: criticalCount, color: criticalCount > 0 ? "text-red-400" : "text-white" },
          { label: "Investigating", value: dbIncidents.filter(i => i.status === "investigating").length, color: "text-amber-400" },
          { label: "Resolved", value: resolvedIncidents.length, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Active incidents */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">Active & Investigating</h2>
        {activeIncidents.length === 0 ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-emerald-400">All systems operational</p>
            <p className="text-xs text-white/40 mt-1">No active incidents detected from platform telemetry.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeIncidents.map(incident => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </section>

      {resolvedIncidents.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-white mb-3">Resolved</h2>
          <div className="space-y-3 opacity-60">
            {resolvedIncidents.map(incident => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        </section>
      )}

      {/* Category breakdown */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">Category Coverage</h2>
        <div className="grid grid-cols-4 gap-3">
          {CATEGORIES.slice(1).map(cat => {
            const catIncidents = dbIncidents.filter(i => i.category === cat)
            return (
              <div key={cat} className={`rounded-xl border p-3 ${catIncidents.length > 0 ? "border-amber-500/20 bg-amber-500/5" : "border-white/10 bg-white/5"}`}>
                <p className="text-xs font-medium text-white">{cat}</p>
                <p className={`text-lg font-bold mt-1 ${catIncidents.length > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {catIncidents.length === 0 ? "✓" : catIncidents.length}
                </p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function IncidentCard({ incident }: { incident: Incident }) {
  const status = STATUS_CONFIG[incident.status]
  return (
    <div className={`rounded-xl border p-5 ${incident.status === "active" ? "border-red-500/20 bg-red-500/5" : incident.status === "investigating" ? "border-amber-500/20 bg-amber-500/5" : "border-white/10 bg-white/5"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${incident.severity === "critical" ? "text-red-400" : incident.severity === "high" ? "text-orange-400" : "text-amber-400"}`} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border ${SEVERITY_COLOR[incident.severity]}`}>
                {incident.severity}
              </span>
              <span className="text-xs font-mono text-white/30 uppercase">{incident.category}</span>
              {incident.source === "db" && (
                <span className="text-[10px] font-mono text-[#6C4EF3]">● live</span>
              )}
            </div>
            <p className="text-sm font-semibold text-white mt-1">{incident.title}</p>
            <p className="text-xs text-white/50 mt-1 leading-relaxed">{incident.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs text-white/30">
                {status.icon}
                <span className={status.color}>{status.label}</span>
              </div>
              <span className="text-xs text-white/30">Detected {new Date(incident.detectedAt).toLocaleString()}</span>
            </div>
            {incident.affectedServices.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {incident.affectedServices.map(s => (
                  <span key={s} className="text-[10px] font-mono text-white/40 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        {incident.status !== "resolved" && (
          <button className="shrink-0 text-xs rounded-lg border border-white/10 px-3 py-1.5 text-white/50 hover:bg-white/5 hover:text-white transition-colors">
            Mark Resolved
          </button>
        )}
      </div>
    </div>
  )
}
