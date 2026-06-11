import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Webhook Operations" }

type WebhookEvent = {
  id: string
  source: string
  event_type: string
  status: string
  attempt_count: number
  error_message: string | null
  created_at: string
  processed_at: string | null
  last_attempted_at: string | null
}

const PROVIDERS = ["stripe", "paystack", "whatsapp", "resend"] as const

const STATUS_COLOR: Record<string, string> = {
  processed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  failed: "text-red-400 bg-red-400/10 border-red-400/20",
  dead: "text-white/30 bg-white/5 border-white/10",
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  processed: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
  pending: <Clock className="w-3 h-3 text-amber-400" />,
  failed: <XCircle className="w-3 h-3 text-red-400" />,
  dead: <AlertTriangle className="w-3 h-3 text-white/30" />,
}

const PROVIDER_COLOR: Record<string, string> = {
  stripe: "text-indigo-400",
  paystack: "text-emerald-400",
  whatsapp: "text-green-400",
  resend: "text-blue-400",
}

export default async function WebhooksPage() {
  await requireAdminAccess()
  const supabase = createClient()

  let events: WebhookEvent[] = []
  let totalCount = 0

  try {
    const { data, count, error } = await supabase
      .from("webhook_events")
      .select("id, source, event_type, status, attempt_count, error_message, created_at, processed_at, last_attempted_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100)

    if (!error && data) {
      events = data as WebhookEvent[]
      totalCount = count ?? 0
    }
  } catch (err) {
    console.error("[AdminWebhooks] Failed to fetch webhook events:", err)
  }

  // Per-provider stats
  const providerStats = PROVIDERS.map(provider => {
    const providerEvents = events.filter(e => e.source === provider)
    return {
      provider,
      received: providerEvents.length,
      processed: providerEvents.filter(e => e.status === "processed").length,
      failed: providerEvents.filter(e => e.status === "failed").length,
      retried: providerEvents.filter(e => e.attempt_count > 1).length,
      lastFailure: providerEvents.filter(e => e.status === "failed").sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0] ?? null,
    }
  })

  const totalFailed = events.filter(e => e.status === "failed").length
  const totalPending = events.filter(e => e.status === "pending").length
  const totalDead = events.filter(e => e.status === "dead").length

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-[#6C4EF3]" />
          Webhook Operations
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Real-time webhook event tracking from <code className="font-mono text-white/40">webhook_events</code> table — Stripe, Paystack, WhatsApp, Resend.
        </p>
      </div>

      {totalFailed > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">
            <strong>{totalFailed} failed webhook event{totalFailed > 1 ? "s" : ""}</strong> require investigation.
            {totalDead > 0 && <> {totalDead} have hit the dead-letter threshold.</>}
          </p>
        </div>
      )}

      {/* Global KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total events", value: totalCount },
          { label: "Processed", value: events.filter(e => e.status === "processed").length },
          { label: "Failed", value: totalFailed },
          { label: "Dead (max retries)", value: totalDead },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">{label}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Per-provider breakdown */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">Provider Breakdown</h2>
        <div className="grid grid-cols-2 gap-4">
          {providerStats.map(({ provider, received, processed, failed, retried, lastFailure }) => (
            <div key={provider} className={`rounded-xl border p-5 ${failed > 0 ? "border-red-500/20 bg-red-500/5" : "border-white/10 bg-white/5"}`}>
              <div className="flex items-center justify-between mb-4">
                <p className={`text-base font-bold capitalize ${PROVIDER_COLOR[provider]}`}>{provider}</p>
                {failed > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Received", value: received },
                  { label: "Processed", value: processed },
                  { label: "Failed", value: failed },
                  { label: "Retried", value: retried },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-white/40">{label}</p>
                    <p className={`text-lg font-bold ${label === "Failed" && value > 0 ? "text-red-400" : "text-white"}`}>{value}</p>
                  </div>
                ))}
              </div>
              {lastFailure && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Last failure reason</p>
                  <p className="text-xs text-red-400/70 mt-1 font-mono leading-relaxed break-all">
                    {lastFailure.error_message ?? "No error message recorded"}
                  </p>
                  <p className="text-[10px] text-white/20 mt-0.5">{new Date(lastFailure.created_at).toLocaleString()}</p>
                </div>
              )}
              {received === 0 && (
                <p className="text-xs text-white/30 mt-3">No events received from {provider}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Event log */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">Recent Events</h2>
        {events.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-sm text-white/30">No webhook events in database yet.</p>
            <p className="text-xs text-white/20 mt-1 font-mono">webhook_events table is empty</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Source</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Event Type</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Attempts</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Received</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 50).map(event => (
                  <tr key={event.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-4">
                      <span className={`text-xs font-bold capitalize ${PROVIDER_COLOR[event.source] ?? "text-white/50"}`}>
                        {event.source}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-white/60">{event.event_type}</td>
                    <td className="py-2.5 px-4">
                      <span className={`flex items-center gap-1 text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border w-fit ${STATUS_COLOR[event.status] ?? "text-white/50 bg-white/5 border-white/10"}`}>
                        {STATUS_ICON[event.status]}
                        {event.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-white/50">{event.attempt_count}</td>
                    <td className="py-2.5 px-4 text-white/40">{new Date(event.created_at).toLocaleString()}</td>
                    <td className="py-2.5 px-4 font-mono text-red-400/70 text-[10px] max-w-48 truncate">
                      {event.error_message ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
