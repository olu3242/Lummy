import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { CreditCard, TrendingUp, AlertTriangle, CheckCircle2, XCircle, RefreshCw, DollarSign } from "lucide-react"
import { formatMoney } from "@/lib/globalization"

export const dynamic = "force-dynamic"
export const metadata = { title: "Billing Governance" }

const MOCK_SUBSCRIPTIONS = [
  { id: "s1", org: "Sade Styles", plan: "pro", amount: 29, currency: "USD", status: "active", provider: "stripe", nextBilling: "2026-07-01", lastPayment: "2026-06-01", paymentStatus: "paid" },
  { id: "s2", org: "AfroDrip", plan: "growth", amount: 19, currency: "USD", status: "active", provider: "paystack", nextBilling: "2026-07-10", lastPayment: "2026-06-10", paymentStatus: "paid" },
  { id: "s3", org: "LuxeAfrica", plan: "starter", amount: 9, currency: "USD", status: "active", provider: "stripe", nextBilling: "2026-07-15", lastPayment: "2026-06-15", paymentStatus: "paid" },
  { id: "s4", org: "KofiCraft", plan: "starter", amount: 9, currency: "USD", status: "past_due", provider: "paystack", nextBilling: "2026-06-20", lastPayment: "2026-05-20", paymentStatus: "failed" },
  { id: "s5", org: "BeadsByAmara", plan: "pro", amount: 29, currency: "USD", status: "active", provider: "stripe", nextBilling: "2026-07-20", lastPayment: "2026-06-20", paymentStatus: "paid" },
  { id: "s6", org: "NalaAfrica", plan: "growth", amount: 19, currency: "USD", status: "canceled", provider: "stripe", nextBilling: "—", lastPayment: "2026-05-01", paymentStatus: "refunded" },
]

const PLANS = [
  { name: "starter", price: 9, orgs: 3, features: ["1 storefront", "100 orders/mo", "Basic analytics"] },
  { name: "growth", price: 19, orgs: 2, features: ["3 storefronts", "Unlimited orders", "WhatsApp automation", "AI captions"] },
  { name: "pro", price: 29, orgs: 2, features: ["Unlimited storefronts", "Priority support", "Full AI suite", "Custom domain"] },
]

const PAYMENT_STATUS_ICON: Record<string, React.ReactNode> = {
  paid: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
  failed: <XCircle className="w-3 h-3 text-red-400" />,
  refunded: <RefreshCw className="w-3 h-3 text-amber-400" />,
}

const SUB_STATUS_COLOR: Record<string, string> = {
  active: "text-emerald-400",
  past_due: "text-red-400",
  canceled: "text-white/30",
  trialing: "text-blue-400",
}

export default async function BillingPage() {
  await requireAdminAccess()
  const supabase = createClient()

  let subs = MOCK_SUBSCRIPTIONS
  try {
    const { data: dbSubs, error } = await supabase
      .from("subscriptions")
      .select(`
        id, status, plan, amount, currency, billing_cycle,
        next_billing_date, payment_provider,
        organizations:org_id ( name )
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (!error && dbSubs && dbSubs.length > 0) {
      subs = (dbSubs as unknown as Array<{
        id: string; status: string; plan: string; amount: number; currency: string
        billing_cycle: string; next_billing_date: string; payment_provider: string
        organizations: { name?: string } | null
      }>).map(s => ({
        id: s.id,
        org: s.organizations?.name ?? "Unknown",
        plan: s.plan ?? "free",
        amount: s.amount ?? 0,
        currency: s.currency ?? "USD",
        status: s.status ?? "active",
        provider: s.payment_provider ?? "stripe",
        nextBilling: s.next_billing_date ?? "—",
        lastPayment: "—",
        paymentStatus: s.status === "active" ? "paid" : s.status === "past_due" ? "failed" : "refunded",
      }))
    }
  } catch (err) {
    console.error("[AdminBilling] Failed to fetch subscriptions:", err)
  }
  const totalMRR = subs.filter(s => s.status === "active").reduce((acc, s) => acc + s.amount, 0)
  const pastDue = subs.filter(s => s.status === "past_due").length
  const stripeCount = subs.filter(s => s.provider === "stripe").length
  const paystackCount = subs.filter(s => s.provider === "paystack").length

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-[#6C4EF3]" />
          Billing Governance
        </h1>
        <p className="text-sm text-white/50 mt-1">Monitor subscriptions, plan distribution, payment status, and sync with Stripe and Paystack.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Monthly Recurring Revenue", value: formatMoney(totalMRR), icon: TrendingUp, color: "text-emerald-400" },
          { label: "Active Subscriptions", value: subs.filter(s => s.status === "active").length, icon: CheckCircle2, color: "text-[#6C4EF3]" },
          { label: "Past Due", value: pastDue, icon: AlertTriangle, color: "text-red-400" },
          { label: "Canceled", value: subs.filter(s => s.status === "canceled").length, icon: XCircle, color: "text-white/30" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/50">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Payment providers */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: "Stripe", count: stripeCount, status: "connected", color: "text-indigo-400", bg: "bg-indigo-400/10" },
          { name: "Paystack", count: paystackCount, status: "connected", color: "text-emerald-400", bg: "bg-emerald-400/10" },
        ].map(({ name, count, status, color, bg }) => (
          <div key={name} className={`rounded-xl border border-white/10 ${bg} p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-bold ${color}`}>{name}</p>
                <p className="text-xs text-white/50 mt-0.5">{count} active subscriptions</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                {status}
              </div>
            </div>
            <button className="mt-3 text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Sync now
            </button>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#6C4EF3]" /> Plan Distribution
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div key={plan.name} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white capitalize">{plan.name}</span>
                <span className="text-xs font-mono text-[#6C4EF3]">{formatMoney(plan.price)}/mo</span>
              </div>
              <p className="text-2xl font-bold text-white">{plan.orgs}</p>
              <p className="text-xs text-white/40 mb-3">organizations</p>
              <ul className="space-y-1">
                {plan.features.map(f => (
                  <li key={f} className="text-[11px] text-white/50 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Subscriptions table */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">All Subscriptions</h2>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Organization</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Plan</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Amount</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Provider</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Status</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Last Payment</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Next Billing</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(sub => (
                <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-medium text-white">{sub.org}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] uppercase font-bold font-mono text-[#6C4EF3]">{sub.plan}</span>
                  </td>
                  <td className="py-3 px-4 text-white/70">{formatMoney(sub.amount, sub.currency)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-mono ${sub.provider === "stripe" ? "text-indigo-400" : "text-emerald-400"}`}>
                      {sub.provider}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium capitalize ${SUB_STATUS_COLOR[sub.status] ?? "text-white/50"}`}>
                      {sub.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-white/50">
                      {PAYMENT_STATUS_ICON[sub.paymentStatus]}
                      {new Date(sub.lastPayment).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-white/40">{sub.nextBilling}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pastDue > 0 && (
          <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">
              <strong>{pastDue} organization{pastDue > 1 ? "s" : ""}</strong> {pastDue > 1 ? "have" : "has"} past-due payments. Consider triggering dunning reminders via Stripe/Paystack dashboards.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
