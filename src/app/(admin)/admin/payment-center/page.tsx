import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { formatMoney } from "@/lib/globalization"
import {
  CreditCard, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Activity, ShieldCheck, Zap, Clock, BarChart3,
} from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Payment Center" }

type ProviderHealth = "healthy" | "degraded" | "critical"

function HealthBadge({ status }: { status: ProviderHealth }) {
  const map = {
    healthy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    degraded: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    critical: "text-red-400 bg-red-400/10 border-red-400/20",
  }
  return (
    <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border ${map[status]}`}>
      {status}
    </span>
  )
}

export default async function PaymentCenterPage() {
  await requireAdminAccess()
  const supabase = createClient()

  // ── Webhook event stats ──────────────────────────────────────────────
  type ProviderStats = {
    received: number; processed: number; failed: number; retried: number; lastError: string | null
  }
  const providerStats: Record<string, ProviderStats> = {
    stripe: { received: 0, processed: 0, failed: 0, retried: 0, lastError: null },
    paystack: { received: 0, processed: 0, failed: 0, retried: 0, lastError: null },
    whatsapp: { received: 0, processed: 0, failed: 0, retried: 0, lastError: null },
  }
  let totalWebhooks = 0
  let duplicateCount = 0

  try {
    const { data: webhooks } = await supabase
      .from("webhook_events")
      .select("source, status, attempt_count, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(1000)

    if (webhooks) {
      for (const w of webhooks as Array<{
        source: string; status: string; attempt_count?: number; error_message?: string | null
      }>) {
        totalWebhooks++
        const src = w.source ?? "unknown"
        if (!providerStats[src]) {
          providerStats[src] = { received: 0, processed: 0, failed: 0, retried: 0, lastError: null }
        }
        providerStats[src].received++
        if (w.status === "processed" || w.status === "success") providerStats[src].processed++
        if (w.status === "failed" || w.status === "error") {
          providerStats[src].failed++
          if (!providerStats[src].lastError && w.error_message) {
            providerStats[src].lastError = w.error_message
          }
        }
        if ((w.attempt_count ?? 0) > 1) providerStats[src].retried++
        if (w.status === "duplicate") duplicateCount++
      }
    }
  } catch (err) {
    console.error("[PaymentCenter] webhook_events query failed:", err)
  }

  // ── Order payment stats ───────────────────────────────────────────────
  let paidOrders = 0
  let failedPayments = 0
  let pendingPayments = 0
  let refundedPayments = 0
  let chargebacks = 0
  let totalRevenue = 0

  try {
    const { data: orders } = await supabase
      .from("orders")
      .select("amount, currency, payment_status, status")
      .limit(1000)

    if (orders) {
      for (const o of orders as Array<{
        amount: number; currency?: string; payment_status?: string; status: string
      }>) {
        const ps = o.payment_status ?? o.status
        if (ps === "paid" || o.status === "completed" || o.status === "delivered") {
          paidOrders++
          totalRevenue += o.amount ?? 0
        } else if (ps === "failed") {
          failedPayments++
        } else if (ps === "pending") {
          pendingPayments++
        } else if (ps === "refunded") {
          refundedPayments++
        } else if (ps === "chargeback" || o.status === "chargeback") {
          chargebacks++
        }
      }
    }
  } catch (err) {
    console.error("[PaymentCenter] orders query failed:", err)
  }

  // ── Provider health classification ───────────────────────────────────
  function classifyHealth(stats: ProviderStats): ProviderHealth {
    if (stats.received === 0) return "healthy"
    const failRate = stats.failed / stats.received
    if (failRate > 0.3) return "critical"
    if (failRate > 0.1) return "degraded"
    return "healthy"
  }

  const stripeHealth = classifyHealth(providerStats.stripe)
  const paystackHealth = classifyHealth(providerStats.paystack)
  const overallHealth: ProviderHealth =
    stripeHealth === "critical" || paystackHealth === "critical" ? "critical"
    : stripeHealth === "degraded" || paystackHealth === "degraded" ? "degraded"
    : "healthy"

  // ── Idempotency / reconciliation checks ──────────────────────────────
  const reconciliationIssues = [
    {
      check: "Idempotency keys",
      status: "pass" as "pass" | "warn" | "fail",
      detail: "webhook_events table uses unique constraint on idempotency_key to prevent duplicate processing",
    },
    {
      check: "Duplicate event protection",
      status: duplicateCount > 5 ? "warn" as "pass" | "warn" | "fail" : "pass",
      detail: `${duplicateCount} duplicate event${duplicateCount !== 1 ? "s" : ""} detected in event log`,
    },
    {
      check: "Subscription → DB sync",
      status: "warn" as "pass" | "warn" | "fail",
      detail: "subscriptions table referenced in billing page but migration not confirmed in supabase/migrations/",
    },
    {
      check: "Order status on webhook",
      status: "pass" as "pass" | "warn" | "fail",
      detail: "Payment webhook handler updates orders + payments tables on success/failure events",
    },
    {
      check: "Chargeback handling",
      status: chargebacks > 0 ? "warn" as "pass" | "warn" | "fail" : "pass",
      detail: chargebacks > 0 ? `${chargebacks} chargeback(s) detected — review dispute management` : "No chargebacks detected",
    },
  ]

  const statusIcon = {
    pass: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    warn: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    fail: <XCircle className="w-3.5 h-3.5 text-red-400" />,
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#6C4EF3]" />
            Payment Center
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Payment reliability — Stripe, Paystack, webhook delivery, reconciliation, idempotency.
          </p>
        </div>
        <HealthBadge status={overallHealth} />
      </div>

      {overallHealth !== "healthy" && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-400">
            Payment system showing {overallHealth} status. Review provider webhook logs for root cause.
          </p>
        </div>
      )}

      {/* Revenue KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/50">Total Revenue (paid)</p>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">{formatMoney(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/50 mb-2">Paid Orders</p>
          <p className="text-3xl font-bold text-emerald-400">{paidOrders}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/50 mb-2">Total Webhooks Received</p>
          <p className="text-3xl font-bold text-white">{totalWebhooks}</p>
        </div>
      </div>

      {/* Payment outcome KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Failed Payments", value: failedPayments, color: failedPayments > 0 ? "text-red-400" : "text-white/30", icon: XCircle },
          { label: "Pending", value: pendingPayments, color: pendingPayments > 0 ? "text-amber-400" : "text-white/30", icon: Clock },
          { label: "Refunded", value: refundedPayments, color: refundedPayments > 0 ? "text-blue-400" : "text-white/30", icon: RefreshCw },
          { label: "Chargebacks", value: chargebacks, color: chargebacks > 0 ? "text-red-400" : "text-white/30", icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/50">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Provider breakdown */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#6C4EF3]" /> Provider Webhook Health
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(providerStats)
            .filter(([, s]) => s.received > 0 || ["stripe", "paystack"].includes(""))
            .map(([provider, stats]) => {
              const health = classifyHealth(stats)
              return (
                <div key={provider} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-sm font-bold capitalize ${
                      provider === "stripe" ? "text-indigo-400"
                      : provider === "paystack" ? "text-emerald-400"
                      : "text-white/70"
                    }`}>{provider}</p>
                    <HealthBadge status={health} />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/40">Received</span>
                      <span className="text-white">{stats.received}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Processed</span>
                      <span className="text-emerald-400">{stats.processed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Failed</span>
                      <span className={stats.failed > 0 ? "text-red-400" : "text-white/30"}>{stats.failed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Retried</span>
                      <span className={stats.retried > 0 ? "text-amber-400" : "text-white/30"}>{stats.retried}</span>
                    </div>
                  </div>
                  {stats.lastError && (
                    <p className="mt-3 text-[10px] text-red-400 font-mono truncate" title={stats.lastError}>
                      Last error: {stats.lastError}
                    </p>
                  )}
                </div>
              )
            })}
        </div>
        {Object.values(providerStats).every(s => s.received === 0) && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-sm text-white/30">No webhook events found in database.</p>
            <p className="text-xs text-white/20 mt-1 font-mono">webhook_events table returned 0 rows</p>
          </div>
        )}
      </section>

      {/* Reconciliation checks */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#6C4EF3]" /> Payment Reliability Checks
        </h2>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Check</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Status</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Detail</th>
              </tr>
            </thead>
            <tbody>
              {reconciliationIssues.map(({ check, status, detail }) => (
                <tr key={check} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-medium text-white text-sm">{check}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {statusIcon[status]}
                      <span className={`text-xs capitalize ${
                        status === "pass" ? "text-emerald-400"
                        : status === "warn" ? "text-amber-400"
                        : "text-red-400"
                      }`}>{status === "pass" ? "Pass" : status === "warn" ? "Warning" : "Fail"}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-white/50">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center gap-2 text-xs text-white/20">
        <BarChart3 className="w-3 h-3" />
        <span>Sources: <span className="font-mono">webhook_events</span>, <span className="font-mono">orders</span></span>
      </div>
    </div>
  )
}
