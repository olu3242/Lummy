import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ClipboardList, ArrowRight, Shield, Activity, Database } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Audit Trail" }

const ACTION_COLOR: Record<string, string> = {
  create: "text-emerald-400 bg-emerald-400/10",
  update: "text-blue-400 bg-blue-400/10",
  delete: "text-red-400 bg-red-400/10",
  login: "text-[#6C4EF3] bg-[#6C4EF3]/10",
  suspend: "text-amber-400 bg-amber-400/10",
  transfer: "text-sky-400 bg-sky-400/10",
  invite: "text-teal-400 bg-teal-400/10",
  revoke: "text-rose-400 bg-rose-400/10",
}

const MOCK_AUDIT = [
  { id: "a1", action: "create", resource: "product", resourceId: "p-8821", actor: "sade@lummy.co", org: "Sade Styles", at: "2026-06-06 14:23", ip: "41.58.12.3", meta: { name: "Ankara Print Dress v2" } },
  { id: "a2", action: "login", resource: "auth", resourceId: "u-1201", actor: "emeka@afrodrip.ng", org: "AfroDrip", at: "2026-06-06 13:11", ip: "197.210.55.2", meta: {} },
  { id: "a3", action: "suspend", resource: "organization", resourceId: "o4", actor: "admin@lummy.co", org: "Platform", at: "2026-06-06 12:45", ip: "192.168.1.1", meta: { reason: "Payment failure" } },
  { id: "a4", action: "delete", resource: "order", resourceId: "o-9921", actor: "tunde@lummy.co", org: "Sade Styles", at: "2026-06-06 11:30", ip: "41.58.12.3", meta: { orderNumber: "LMY-00299" } },
  { id: "a5", action: "invite", resource: "team_member", resourceId: "u-new1", actor: "fatima@luxeafrica.co", org: "LuxeAfrica", at: "2026-06-06 10:15", ip: "105.112.88.9", meta: { invitedEmail: "staff@luxeafrica.co", role: "STORE_MANAGER" } },
  { id: "a6", action: "transfer", resource: "organization", resourceId: "o3", actor: "admin@lummy.co", org: "Platform", at: "2026-06-06 09:00", ip: "192.168.1.1", meta: { from: "old@lux.co", to: "fatima@luxeafrica.co" } },
  { id: "a7", action: "update", resource: "subscription", resourceId: "s2", actor: "billing@lummy.co", org: "Platform", at: "2026-06-05 22:18", ip: "10.0.0.5", meta: { plan: "growth → pro" } },
  { id: "a8", action: "revoke", resource: "team_member", resourceId: "m3", actor: "emeka@afrodrip.ng", org: "AfroDrip", at: "2026-06-05 18:44", ip: "197.210.55.2", meta: { member: "junior@afrodrip.ng" } },
]

export default async function AuditPage() {
  await requireAdminAccess()
  const supabase = createClient()

  const { data: dbLogs } = await supabase
    .from("platform_audit_logs")
    .select("id, action, resource_type, actor_id, created_at")
    .order("created_at", { ascending: false })
    .limit(20)

  const logs = dbLogs && dbLogs.length > 0 ? dbLogs.map((l: { id: string; action: string; resource_type: string; actor_id: string; created_at: string }) => ({
    id: l.id,
    action: l.action,
    resource: l.resource_type,
    resourceId: "—",
    actor: l.actor_id,
    org: "—",
    at: new Date(l.created_at).toLocaleString(),
    ip: "—",
    meta: {},
  })) : MOCK_AUDIT

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-[#6C4EF3]" />
          Audit Trail
        </h1>
        <p className="text-sm text-white/50 mt-1">Complete record of all platform actions. Use resource history and security audit sub-views for deep investigation.</p>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-3">
        {[
          { label: "All Events", href: "/admin/audit", icon: Activity, active: true },
          { label: "Security Audit", href: "/admin/audit/security", icon: Shield, active: false },
        ].map(({ label, href, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-[#6C4EF3] text-white" : "border border-white/10 text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Events today", value: logs.filter(l => l.at.includes("2026-06-06")).length },
          { label: "Create events", value: logs.filter(l => l.action === "create").length },
          { label: "Delete events", value: logs.filter(l => l.action === "delete").length },
          { label: "Auth events", value: logs.filter(l => l.action === "login").length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Log table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left py-3 px-4 text-white/50 font-medium">Timestamp</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium">Action</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium">Resource</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium">Actor</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium">Organization</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium">IP</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium">Details</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-2.5 px-4 font-mono text-white/40">{log.at}</td>
                <td className="py-2.5 px-4">
                  <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${ACTION_COLOR[log.action] ?? "text-white/50 bg-white/5"}`}>
                    {log.action}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-1">
                    <Database className="w-3 h-3 text-white/30" />
                    <span className="text-white/60 font-mono">{log.resource}</span>
                  </div>
                  <span className="text-white/30 font-mono text-[10px]">{log.resourceId}</span>
                </td>
                <td className="py-2.5 px-4 text-white/60">{log.actor}</td>
                <td className="py-2.5 px-4 text-white/40">{log.org}</td>
                <td className="py-2.5 px-4 font-mono text-white/30">{log.ip}</td>
                <td className="py-2.5 px-4 text-white/30 font-mono text-[10px] max-w-32 truncate">
                  {Object.keys(log.meta).length > 0 ? JSON.stringify(log.meta) : "—"}
                </td>
                <td className="py-2.5 px-4">
                  <Link
                    href={`/admin/audit/resources/${log.id}`}
                    className="text-[#6C4EF3] hover:text-white transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dbLogs && dbLogs.length === 0 && (
        <p className="text-xs text-white/30 text-center py-4">Showing demo data. No records yet in <code className="font-mono">platform_audit_logs</code>.</p>
      )}
    </div>
  )
}
