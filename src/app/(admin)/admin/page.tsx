import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Shield, Users, Building2, CreditCard, ClipboardList, HeadphonesIcon, Settings2, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Admin Overview" }

const PHASES = [
  { label: "Security Center", href: "/admin/security", icon: Shield, desc: "Permission matrix, RLS status, tenant isolation" },
  { label: "Teams", href: "/admin/teams", icon: Users, desc: "Invite, disable, revoke team members across orgs" },
  { label: "Organizations", href: "/admin/organizations", icon: Building2, desc: "Org governance, ownership transfers, suspension" },
  { label: "Billing", href: "/admin/billing", icon: CreditCard, desc: "Stripe + Paystack sync, plan management" },
  { label: "Audit Trail", href: "/admin/audit", icon: ClipboardList, desc: "Complete platform audit log with resource history" },
  { label: "Support Center", href: "/admin/support", icon: HeadphonesIcon, desc: "Support tickets, escalations, user lookup" },
  { label: "Governance", href: "/admin/governance", icon: Settings2, desc: "Platform health, feature flags, compliance" },
]

export default async function AdminOverview() {
  const { role } = await requireAdminAccess()
  const supabase = createClient()

  const [{ count: orgCount }, { count: memberCount }, { count: ticketCount }] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("organization_members").select("id", { count: "exact", head: true }),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
  ])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Admin Console</h1>
        <p className="text-sm text-white/50 mt-1">
          Logged in as <span className="text-[#6C4EF3] font-mono">{role}</span>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Organizations", value: orgCount ?? 0 },
          { label: "Total Members", value: memberCount ?? 0 },
          { label: "Open Tickets", value: ticketCount ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">{label}</p>
            <p className="text-3xl font-bold text-white mt-1">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Phase cards */}
      <div className="grid grid-cols-2 gap-4">
        {PHASES.map(({ label, href, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-white/10 bg-white/5 p-5 hover:border-[#6C4EF3]/50 hover:bg-[#6C4EF3]/5 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-lg bg-[#6C4EF3]/20 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-[#6C4EF3]" />
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#6C4EF3] transition-colors" />
            </div>
            <p className="mt-3 text-sm font-semibold text-white">{label}</p>
            <p className="text-xs text-white/50 mt-1 leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
