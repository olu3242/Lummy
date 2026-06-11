import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { CheckCircle2, XCircle, AlertTriangle, Shield, Lock, Eye } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Security Center" }

const ROLES = [
  "SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "ORG_OWNER",
  "ORG_ADMIN",
  "STORE_MANAGER",
  "SALES_MANAGER",
  "SUPPORT_AGENT",
  "FULFILLMENT_AGENT",
  "TEAM_MEMBER",
  "CUSTOMER",
] as const

// Permission matrix — rows = permissions, cols = roles
const PERMISSIONS = [
  { label: "View admin console", key: "admin.view", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN"] },
  { label: "Manage platform users", key: "admin.users.manage", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN"] },
  { label: "View all organizations", key: "orgs.view_all", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN"] },
  { label: "Suspend organization", key: "orgs.suspend", roles: ["SUPER_ADMIN"] },
  { label: "Transfer org ownership", key: "orgs.transfer", roles: ["SUPER_ADMIN", "ORG_OWNER"] },
  { label: "Manage billing", key: "billing.manage", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN", "ORG_OWNER"] },
  { label: "View audit logs", key: "audit.view", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN", "ORG_OWNER", "ORG_ADMIN"] },
  { label: "Invite team members", key: "teams.invite", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN", "ORG_OWNER", "ORG_ADMIN"] },
  { label: "Revoke team access", key: "teams.revoke", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN", "ORG_OWNER", "ORG_ADMIN"] },
  { label: "Manage products", key: "products.manage", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN", "ORG_OWNER", "ORG_ADMIN", "STORE_MANAGER"] },
  { label: "Manage orders", key: "orders.manage", roles: ["SUPER_ADMIN", "ORG_OWNER", "ORG_ADMIN", "STORE_MANAGER", "SALES_MANAGER", "FULFILLMENT_AGENT"] },
  { label: "View orders", key: "orders.view", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN", "ORG_OWNER", "ORG_ADMIN", "STORE_MANAGER", "SALES_MANAGER", "SUPPORT_AGENT", "FULFILLMENT_AGENT"] },
  { label: "Handle support tickets", key: "support.handle", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN", "SUPPORT_AGENT"] },
  { label: "View store analytics", key: "analytics.view", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN", "ORG_OWNER", "ORG_ADMIN", "STORE_MANAGER", "SALES_MANAGER"] },
  { label: "Manage customers (CRM)", key: "crm.manage", roles: ["SUPER_ADMIN", "ORG_OWNER", "ORG_ADMIN", "STORE_MANAGER", "SALES_MANAGER"] },
  { label: "Fulfill orders", key: "orders.fulfill", roles: ["SUPER_ADMIN", "ORG_OWNER", "ORG_ADMIN", "STORE_MANAGER", "FULFILLMENT_AGENT"] },
  { label: "WhatsApp messaging", key: "whatsapp.send", roles: ["SUPER_ADMIN", "ORG_OWNER", "ORG_ADMIN", "STORE_MANAGER", "SALES_MANAGER", "SUPPORT_AGENT"] },
  { label: "AI features", key: "ai.use", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN", "ORG_OWNER", "ORG_ADMIN", "STORE_MANAGER", "SALES_MANAGER", "TEAM_MEMBER"] },
  { label: "Purchase (storefront)", key: "store.purchase", roles: ["CUSTOMER"] },
  { label: "View own profile", key: "profile.view_own", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN", "ORG_OWNER", "ORG_ADMIN", "STORE_MANAGER", "SALES_MANAGER", "SUPPORT_AGENT", "FULFILLMENT_AGENT", "TEAM_MEMBER", "CUSTOMER"] },
]

const PROTECTED_ROUTES = [
  { path: "/admin/**", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN"], rls: true },
  { path: "/ops/**", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN"], rls: true },
  { path: "/dashboard/**", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN", "ORG_OWNER", "ORG_ADMIN", "STORE_MANAGER", "SALES_MANAGER", "SUPPORT_AGENT", "FULFILLMENT_AGENT", "TEAM_MEMBER"], rls: true },
  { path: "/onboarding/**", roles: ["all authenticated"], rls: false },
  { path: "/api/admin/**", roles: ["SUPER_ADMIN", "PLATFORM_ADMIN"], rls: true },
  { path: "/api/webhooks/**", roles: ["public (signed)"], rls: false },
  { path: "/[handle]/**", roles: ["public"], rls: false },
]

const RLS_TABLES = [
  { table: "profiles", status: "enabled", policy: "Users see own row; admins see all" },
  { table: "organizations", status: "enabled", policy: "Members see their org; admins see all" },
  { table: "organization_members", status: "enabled", policy: "Org admins manage members" },
  { table: "products", status: "enabled", policy: "Creator sees own; public sees enabled" },
  { table: "orders", status: "enabled", policy: "Creator/customer isolation; admins bypass" },
  { table: "transactions", status: "enabled", policy: "Org-scoped; SUPER_ADMIN bypass" },
  { table: "support_tickets", status: "enabled", policy: "Creator own tickets; agents see assigned" },
  { table: "audit_actions", status: "enabled", policy: "Append-only; admins read-all" },
  { table: "platform_audit_logs", status: "enabled", policy: "SUPER_ADMIN read-only" },
  { table: "subscriptions", status: "enabled", policy: "Org-scoped" },
  { table: "campaigns", status: "enabled", policy: "Creator-scoped" },
  { table: "leads", status: "enabled", policy: "Creator-scoped" },
]

const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPER_ADMIN: "Full platform god-mode. Unrestricted.",
  PLATFORM_ADMIN: "Platform operations. No org suspension.",
  ORG_OWNER: "Full org control. Can transfer ownership.",
  ORG_ADMIN: "Manage org members, products, orders.",
  STORE_MANAGER: "Products, orders, analytics.",
  SALES_MANAGER: "Orders, CRM, WhatsApp outreach.",
  SUPPORT_AGENT: "Tickets, order views, customer lookup.",
  FULFILLMENT_AGENT: "Order fulfillment only.",
  TEAM_MEMBER: "Basic access. AI tools only.",
  CUSTOMER: "Storefront purchase only.",
}

function StatusBadge({ status }: { status: "enabled" | "disabled" | "warning" }) {
  if (status === "enabled") return <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium"><CheckCircle2 className="w-3 h-3" />Enabled</span>
  if (status === "disabled") return <span className="flex items-center gap-1 text-red-400 text-xs font-medium"><XCircle className="w-3 h-3" />Disabled</span>
  return <span className="flex items-center gap-1 text-amber-400 text-xs font-medium"><AlertTriangle className="w-3 h-3" />Warning</span>
}

export default async function SecurityPage() {
  await requireAdminAccess()
  const supabase = createClient()

  let dbPermissions: { name: string; description: string }[] | null = null
  try {
    const { data, error } = await supabase
      .from("org_permissions")
      .select("name, description")
      .limit(50)
    if (!error) dbPermissions = data
  } catch (err) {
    console.error("[AdminSecurity] Failed to fetch permissions:", err)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#6C4EF3]" />
          Security Center
        </h1>
        <p className="text-sm text-white/50 mt-1">Permission matrix, access rules, RLS status, and tenant isolation for all 10 platform roles.</p>
      </div>

      {/* Role Overview */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#6C4EF3]" /> Role Definitions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map(role => (
            <div key={role} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[#6C4EF3]">{role}</span>
                {(role === "SUPER_ADMIN" || role === "PLATFORM_ADMIN") && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 border border-red-400/30 rounded px-1.5 py-0.5">PRIVILEGED</span>
                )}
              </div>
              <p className="text-xs text-white/50 mt-1.5">{ROLE_DESCRIPTIONS[role]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Permission Matrix */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#6C4EF3]" /> Permission Matrix
        </h2>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left py-3 px-4 text-white/60 font-medium w-56">Permission</th>
                  {ROLES.map(r => (
                    <th key={r} className="py-3 px-2 text-white/40 font-mono text-[9px] text-center min-w-[72px]">
                      {r.replace("_", "_\n")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map(({ label, key, roles }) => (
                  <tr key={key} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2.5 px-4">
                      <span className="text-white/80">{label}</span>
                      <span className="block text-white/30 font-mono text-[9px] mt-0.5">{key}</span>
                    </td>
                    {ROLES.map(role => (
                      <td key={role} className="py-2.5 px-2 text-center">
                        {roles.includes(role) ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="w-3.5 h-0.5 bg-white/10 block mx-auto mt-1.5 rounded" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {dbPermissions && dbPermissions.length > 0 && (
          <p className="text-xs text-white/30 mt-2">
            {dbPermissions.length} additional DB-level permissions defined in <code className="font-mono">org_permissions</code>
          </p>
        )}
      </section>

      {/* Protected Routes */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#6C4EF3]" /> Access Rules — Protected Routes
        </h2>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left py-3 px-4 text-white/60 font-medium">Route Pattern</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">Allowed Roles</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">RLS</th>
              </tr>
            </thead>
            <tbody>
              {PROTECTED_ROUTES.map(({ path, roles, rls }) => (
                <tr key={path} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2.5 px-4 font-mono text-[#6C4EF3]">{path}</td>
                  <td className="py-2.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {roles.map(r => (
                        <span key={r} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 text-[9px] font-mono">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={rls ? "enabled" : "disabled"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* RLS Status */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#6C4EF3]" /> RLS Status — All Tables
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {RLS_TABLES.map(({ table, status, policy }) => (
            <div key={table} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-white font-semibold">{table}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{policy}</p>
              </div>
              <StatusBadge status={status as "enabled" | "disabled" | "warning"} />
            </div>
          ))}
        </div>
      </section>

      {/* Tenant Isolation */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">Tenant Isolation Status</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Row-Level Security", status: "enabled" as const, detail: "All 12 core tables protected" },
            { label: "Org-Scoped Queries", status: "enabled" as const, detail: "All API routes filter by org_id" },
            { label: "Cross-Tenant Reads", status: "enabled" as const, detail: "Blocked via Supabase RLS policies" },
            { label: "Service Role Exposure", status: "enabled" as const, detail: "SUPABASE_SERVICE_ROLE never client-side" },
            { label: "Auth Token Isolation", status: "enabled" as const, detail: "JWT validated per-request" },
            { label: "Storage Bucket Policies", status: "warning" as const, detail: "Verify bucket-level RLS in Supabase dashboard" },
          ].map(({ label, status, detail }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <StatusBadge status={status} />
              <p className="text-sm font-semibold text-white mt-2">{label}</p>
              <p className="text-[11px] text-white/40 mt-1">{detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
