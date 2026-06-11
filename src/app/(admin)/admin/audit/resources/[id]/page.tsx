import { requireAdminAccess } from "@/lib/admin/auth"
import Link from "next/link"
import { ArrowLeft, Clock, User, Globe, Database, Code } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Audit Event Detail" }

// Mock event — in production fetched from platform_audit_logs by id
const MOCK_EVENT = {
  id: "a1",
  action: "create",
  resource: "product",
  resourceId: "p-8821",
  actor: "sade@lummy.co",
  actorId: "u-1201",
  org: "Sade Styles",
  orgId: "o1",
  at: "2026-06-06 14:23:11 UTC",
  ip: "41.58.12.3",
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4) AppleWebKit/605.1.15",
  correlationId: "req_1717680191_a4b2c",
  before: null,
  after: {
    id: "p-8821",
    title: "Ankara Print Dress v2",
    price: 20,
    currency: "USD",
    status: "active",
    created_at: "2026-06-06T14:23:11Z",
  },
  meta: {
    method: "POST",
    path: "/api/products",
    statusCode: 201,
  },
}

const RESOURCE_HISTORY = [
  { id: "a1", action: "create", at: "2026-06-06 14:23", actor: "sade@lummy.co", summary: "Product created" },
  { id: "a9", action: "update", at: "2026-06-06 16:00", actor: "sade@lummy.co", summary: "Price updated: $20 → $22" },
  { id: "a10", action: "update", at: "2026-06-07 09:10", actor: "tunde@lummy.co", summary: "Stock updated: 14 → 8" },
]

const ACTION_COLOR: Record<string, string> = {
  create: "text-emerald-400 bg-emerald-400/10",
  update: "text-blue-400 bg-blue-400/10",
  delete: "text-red-400 bg-red-400/10",
}

export default async function AuditResourcePage({ params }: { params: { id: string } }) {
  await requireAdminAccess()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/audit" className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Audit Event Detail</h1>
          <p className="text-xs text-white/40 font-mono">{params.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          {/* Event Summary */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Action", value: <span className={`text-[11px] font-bold uppercase font-mono px-2 py-0.5 rounded ${ACTION_COLOR[MOCK_EVENT.action] ?? "text-white/50 bg-white/5"}`}>{MOCK_EVENT.action}</span>, raw: false },
                { label: "Resource", value: <span className="font-mono text-[#6C4EF3]">{MOCK_EVENT.resource} / {MOCK_EVENT.resourceId}</span>, raw: false },
                { label: "Actor", value: MOCK_EVENT.actor, raw: true },
                { label: "Organization", value: MOCK_EVENT.org, raw: true },
                { label: "Timestamp", value: MOCK_EVENT.at, raw: true },
                { label: "Correlation ID", value: MOCK_EVENT.correlationId, raw: true },
              ].map(({ label, value, raw }) => (
                <div key={label}>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
                  {raw ? (
                    <p className="text-sm font-mono text-white/80 mt-0.5">{value as string}</p>
                  ) : (
                    <div className="mt-0.5">{value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Request context */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#6C4EF3]" /> Request Context
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: "IP Address", value: MOCK_EVENT.ip, icon: Globe },
                { label: "HTTP Method", value: MOCK_EVENT.meta.method, icon: Code },
                { label: "Path", value: MOCK_EVENT.meta.path, icon: Code },
                { label: "Status Code", value: String(MOCK_EVENT.meta.statusCode), icon: Code },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-white/40">{label}</p>
                  <p className="font-mono text-white/70 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">User Agent</p>
              <p className="font-mono text-[11px] text-white/50 break-all">{MOCK_EVENT.userAgent}</p>
            </div>
          </div>

          {/* Before / After diff */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Code className="w-4 h-4 text-[#6C4EF3]" /> State Diff
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Before</p>
                <pre className="rounded-lg bg-black/30 border border-white/5 p-3 text-[11px] text-white/40 font-mono overflow-auto">
                  {MOCK_EVENT.before ? JSON.stringify(MOCK_EVENT.before, null, 2) : "null (new record)"}
                </pre>
              </div>
              <div>
                <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-2">After</p>
                <pre className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3 text-[11px] text-emerald-400/80 font-mono overflow-auto">
                  {JSON.stringify(MOCK_EVENT.after, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Resource history */}
        <div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#6C4EF3]" /> Resource History
            </h3>
            <p className="text-[11px] text-white/40 mb-3 font-mono">product / {MOCK_EVENT.resourceId}</p>
            <div className="space-y-3">
              {RESOURCE_HISTORY.map((ev, i) => (
                <div key={ev.id} className={`relative pl-4 ${i < RESOURCE_HISTORY.length - 1 ? "pb-3 border-b border-white/5" : ""}`}>
                  <div className={`absolute left-0 top-1 w-1.5 h-1.5 rounded-full ${ev.id === params.id ? "bg-[#6C4EF3]" : "bg-white/20"}`} />
                  <p className="text-xs font-medium text-white">{ev.summary}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{ev.actor}</p>
                  <p className="text-[10px] font-mono text-white/20">{ev.at}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 mt-4">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-[#6C4EF3]" /> Actor Context
            </h3>
            <p className="text-xs text-white/60">{MOCK_EVENT.actor}</p>
            <p className="text-[11px] text-white/30 font-mono">{MOCK_EVENT.actorId}</p>
            <p className="text-[11px] text-white/30 mt-1">{MOCK_EVENT.org}</p>
            <Link
              href={`/admin/teams`}
              className="mt-3 text-xs text-[#6C4EF3] hover:text-white transition-colors flex items-center gap-1"
            >
              View in Teams →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
