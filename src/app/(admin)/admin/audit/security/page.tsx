import { requireAdminAccess } from "@/lib/admin/auth"
import Link from "next/link"
import { Shield, AlertTriangle, ArrowLeft, Clock, Globe, User } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Security Audit" }

const SECURITY_EVENTS = [
  { id: "se1", type: "failed_login", severity: "medium", actor: "unknown@example.com", ip: "185.220.101.45", at: "2026-06-06 13:55", detail: "5 failed login attempts in 10 minutes", resolved: false },
  { id: "se2", type: "privilege_escalation", severity: "high", actor: "staff@afrodrip.ng", ip: "197.210.55.2", at: "2026-06-06 11:20", detail: "Attempted to access /admin without SUPER_ADMIN role", resolved: true },
  { id: "se3", type: "suspicious_ip", severity: "low", actor: "kemi@lummy.co", ip: "103.21.244.0", at: "2026-06-05 22:10", detail: "Login from Tor exit node", resolved: false },
  { id: "se4", type: "mass_data_access", severity: "medium", actor: "export-bot@lummy.co", ip: "10.0.0.1", at: "2026-06-05 18:30", detail: "Bulk export of 12,000 order records", resolved: true },
  { id: "se5", type: "api_rate_limit", severity: "low", actor: "api-key:sk_…redacted", ip: "54.213.8.9", at: "2026-06-05 16:45", detail: "Rate limit hit 3× in 1 hour on /api/products", resolved: true },
]

const SEVERITY_COLOR: Record<string, string> = {
  high: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  low: "text-blue-400 bg-blue-400/10 border-blue-400/20",
}

const TYPE_LABEL: Record<string, string> = {
  failed_login: "Failed Login",
  privilege_escalation: "Privilege Escalation",
  suspicious_ip: "Suspicious IP",
  mass_data_access: "Mass Data Access",
  api_rate_limit: "Rate Limit",
}

export default async function SecurityAuditPage() {
  await requireAdminAccess()

  const highCount = SECURITY_EVENTS.filter(e => e.severity === "high").length
  const unresolvedCount = SECURITY_EVENTS.filter(e => !e.resolved).length

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/audit" className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#6C4EF3]" />
            Security Audit
          </h1>
          <p className="text-sm text-white/50 mt-0.5">Security-specific events — privilege escalation, failed logins, suspicious access.</p>
        </div>
      </div>

      {highCount > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-400">{highCount} high-severity event{highCount > 1 ? "s" : ""} detected</p>
            <p className="text-xs text-red-400/70 mt-0.5">Review and resolve immediately. High-severity events may indicate active attack attempts.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total events", value: SECURITY_EVENTS.length },
          { label: "High severity", value: highCount },
          { label: "Unresolved", value: unresolvedCount },
          { label: "Last 24h", value: SECURITY_EVENTS.filter(e => e.at.includes("2026-06-06")).length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {SECURITY_EVENTS.map(event => (
          <div
            key={event.id}
            className={`rounded-xl border p-4 ${event.resolved ? "border-white/10 bg-white/5 opacity-60" : "border-amber-500/20 bg-amber-500/5"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${event.severity === "high" ? "text-red-400" : event.severity === "medium" ? "text-amber-400" : "text-blue-400"}`} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border ${SEVERITY_COLOR[event.severity]}`}>
                      {event.severity}
                    </span>
                    <span className="text-xs font-semibold text-white">{TYPE_LABEL[event.type] ?? event.type}</span>
                    {event.resolved && (
                      <span className="text-[10px] font-mono text-emerald-400">✓ Resolved</span>
                    )}
                  </div>
                  <p className="text-sm text-white/70 mt-1">{event.detail}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{event.actor}</span>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{event.ip}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.at}</span>
                  </div>
                </div>
              </div>
              {!event.resolved && (
                <button className="shrink-0 text-xs rounded-lg border border-amber-500/30 px-3 py-1.5 text-amber-400 hover:bg-amber-500/10 transition-colors">
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
