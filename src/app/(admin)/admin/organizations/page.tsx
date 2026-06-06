import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Building2, ArrowRight, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { formatMoney } from "@/lib/globalization"

export const dynamic = "force-dynamic"
export const metadata = { title: "Organizations" }

type Org = {
  id: string
  name: string
  slug: string
  status: string
  plan: string
  created_at: string
  member_count?: number
  owner_email?: string
}

export default async function OrganizationsPage() {
  await requireAdminAccess()
  const supabase = createClient()

  let orgs: Org[] | null = null
  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, slug, status, plan, created_at")
      .order("created_at", { ascending: false })
      .limit(100)
    if (!error) orgs = data as Org[]
  } catch (err) {
    console.error("[AdminOrgs] Failed to fetch organizations:", err)
  }

  const displayOrgs: Org[] = orgs ?? [
    { id: "o1", name: "Sade Styles", slug: "sade.styles", status: "active", plan: "pro", created_at: "2024-02-10" },
    { id: "o2", name: "AfroDrip", slug: "afrodrip", status: "active", plan: "growth", created_at: "2024-03-15" },
    { id: "o3", name: "LuxeAfrica", slug: "luxeafrica", status: "active", plan: "starter", created_at: "2024-04-01" },
    { id: "o4", name: "KofiCraft", slug: "koficraft", status: "suspended", plan: "starter", created_at: "2024-01-20" },
    { id: "o5", name: "BeadsByAmara", slug: "beadsamara", status: "active", plan: "pro", created_at: "2024-05-10" },
    { id: "o6", name: "NalaAfrica", slug: "nala.africa", status: "active", plan: "growth", created_at: "2024-06-01" },
  ]

  const active = displayOrgs.filter(o => o.status === "active").length
  const suspended = displayOrgs.filter(o => o.status === "suspended").length

  const PLAN_COLOR: Record<string, string> = {
    pro: "text-[#6C4EF3] bg-[#6C4EF3]/10 border-[#6C4EF3]/30",
    growth: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    starter: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    free: "text-white/50 bg-white/5 border-white/10",
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[#6C4EF3]" />
          Organizations
        </h1>
        <p className="text-sm text-white/50 mt-1">Manage all organizations — transfer ownership, suspend, add admins.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Organizations", value: displayOrgs.length },
          { label: "Active", value: active },
          { label: "Suspended", value: suspended },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">{label}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Organization</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Handle</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Plan</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Status</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Created</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {displayOrgs.map(org => (
              <tr key={org.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#6C4EF3]/20 flex items-center justify-center text-xs font-bold text-[#6C4EF3]">
                      {org.name[0]}
                    </div>
                    <p className="font-medium text-white">{org.name}</p>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-white/50">/{org.slug}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-bold font-mono uppercase px-2 py-1 rounded-lg border ${PLAN_COLOR[org.plan] || PLAN_COLOR.free}`}>
                    {org.plan}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 text-xs capitalize text-white/60">
                    {org.status === "active" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : org.status === "suspended" ? (
                      <XCircle className="w-3 h-3 text-red-400" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                    )}
                    {org.status}
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-white/40">{new Date(org.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <Link
                    href={`/admin/organizations/${org.id}`}
                    className="flex items-center gap-1 text-xs text-[#6C4EF3] hover:text-white transition-colors"
                  >
                    Manage <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
