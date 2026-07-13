import Link from "next/link"
import { AlertTriangle, CheckCircle2, Mail, Radio, Send, ServerCrash } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/server"
import { listTemplates } from "@/lib/communications/template-registry"

type DeliveryRow = {
  id: string
  template_id: string
  event_name: string
  recipient: string
  subject: string
  provider_status: string
  correlation_id: string | null
  created_at: string
  error: unknown
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border bg-background p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "sent" || status === "delivered"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : status === "failed" || status === "bounced" || status === "complained"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-slate-200 bg-slate-50 text-slate-700"
  return <span className={`inline-flex border px-2 py-0.5 text-xs font-medium ${tone}`}>{status}</span>
}

export default async function CommunicationsPage() {
  const admin = createAdminClient()
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const [sent, delivered, failed, recent, failures] = await Promise.all([
    admin.from("communication_deliveries").select("id", { count: "exact", head: true }).in("provider_status", ["sent", "delivered"]).gte("created_at", since30d),
    admin.from("communication_deliveries").select("id", { count: "exact", head: true }).eq("provider_status", "delivered").gte("created_at", since30d),
    admin.from("communication_deliveries").select("id", { count: "exact", head: true }).in("provider_status", ["failed", "bounced", "complained"]).gte("created_at", since30d),
    admin.from("communication_deliveries").select("id,template_id,event_name,recipient,subject,provider_status,correlation_id,created_at,error").order("created_at", { ascending: false }).limit(10),
    admin.from("communication_deliveries").select("id,template_id,event_name,recipient,subject,provider_status,correlation_id,created_at,error").in("provider_status", ["failed", "bounced", "complained"]).order("created_at", { ascending: false }).limit(8),
  ])

  const sentCount = sent.count ?? 0
  const deliveredCount = delivered.count ?? 0
  const failedCount = failed.count ?? 0
  const attempted = sentCount + failedCount
  const deliveryRate = attempted > 0 ? `${Math.round((sentCount / attempted) * 100)}%` : "n/a"
  const templates = listTemplates()
  const recentRows = (recent.data ?? []) as DeliveryRow[]
  const failureRows = (failures.data ?? []) as DeliveryRow[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Communications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mission Control for templates, delivery evidence, failures, and provider health.</p>
        </div>
        <Link href="/admin/communications/templates" className="inline-flex items-center gap-2 border border-border px-3 py-2 text-sm font-medium">
          <Mail className="h-4 w-4" />
          Templates
        </Link>
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        <Stat label="Sent" value={sentCount} />
        <Stat label="Delivered" value={deliveredCount} />
        <Stat label="Failed" value={failedCount} />
        <Stat label="Delivery Rate" value={deliveryRate} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="border border-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            <h2 className="font-semibold">Templates</h2>
          </div>
          <p className="text-3xl font-semibold">{templates.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">{templates.filter((template) => template.active).length} active templates in registry.</p>
        </div>
        <div className="border border-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-700" />
            <h2 className="font-semibold">Provider Status</h2>
          </div>
          <p className="text-sm font-medium">Resend adapter connected at runtime</p>
          <p className="mt-1 text-sm text-muted-foreground">Provider success is captured per delivery row.</p>
        </div>
        <div className="border border-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <ServerCrash className="h-4 w-4 text-red-700" />
            <h2 className="font-semibold">Open Issues</h2>
          </div>
          <p className="text-3xl font-semibold">{failureRows.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Recent failed, bounced, or complained sends.</p>
        </div>
      </section>

      <section className="border border-border">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Send className="h-4 w-4" />
          <h2 className="font-semibold">Recent Sends</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Template</th>
                <th className="px-4 py-2">Recipient</th>
                <th className="px-4 py-2">Subject</th>
                <th className="px-4 py-2">Correlation</th>
                <th className="px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentRows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3"><StatusBadge status={row.provider_status} /></td>
                  <td className="px-4 py-3 font-mono text-xs">{row.template_id}</td>
                  <td className="px-4 py-3">{row.recipient}</td>
                  <td className="max-w-md truncate px-4 py-3">{row.subject}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.correlation_id ?? "-"}</td>
                  <td className="px-4 py-3">{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {recentRows.length === 0 ? <tr><td className="px-4 py-6 text-muted-foreground" colSpan={6}>No deliveries recorded yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-border">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-700" />
          <h2 className="font-semibold">Failures</h2>
        </div>
        <div className="divide-y divide-border">
          {failureRows.map((row) => (
            <div key={row.id} className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[160px_1fr_1fr]">
              <span className="font-mono text-xs">{row.template_id}</span>
              <span>{row.recipient}</span>
              <span className="truncate text-muted-foreground">{JSON.stringify(row.error ?? {})}</span>
            </div>
          ))}
          {failureRows.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">No open communication failures.</p> : null}
        </div>
      </section>
    </div>
  )
}
