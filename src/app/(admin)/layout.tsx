import type { Metadata } from "next"
import Link from "next/link"
import { requireAdminAccess } from "@/lib/admin/auth"
import {
  Shield, Users, Building2, CreditCard,
  ClipboardList, HeadphonesIcon, Settings2, LayoutDashboard,
  Zap, ShieldAlert, RefreshCw, Store, ShoppingCart,
} from "lucide-react"

export const metadata: Metadata = {
  title: { default: "Admin Console — Lummy", template: "%s — Lummy Admin" },
  robots: { index: false, follow: false },
}

const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Security", href: "/admin/security", icon: Shield },
  { label: "Teams", href: "/admin/teams", icon: Users },
  { label: "Organizations", href: "/admin/organizations", icon: Building2 },
  { label: "Billing", href: "/admin/billing", icon: CreditCard },
  { label: "Audit Trail", href: "/admin/audit", icon: ClipboardList },
  { label: "Support", href: "/admin/support", icon: HeadphonesIcon },
  { label: "Governance", href: "/admin/governance", icon: Settings2 },
  { label: "Incidents", href: "/admin/incidents", icon: Zap },
  { label: "Auth Ops", href: "/admin/auth", icon: ShieldAlert },
  { label: "Webhooks", href: "/admin/webhooks", icon: RefreshCw },
  { label: "Storefront Ops", href: "/admin/storefront-ops", icon: Store },
  { label: "Checkout", href: "/admin/checkout", icon: ShoppingCart },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminAccess()

  return (
    <div className="min-h-screen flex bg-[#080815]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/10 flex flex-col bg-[#0d0d1a]">
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/10">
          <div className="w-6 h-6 rounded-md bg-[#6C4EF3] flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">Admin Console</span>
          <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-red-400 border border-red-400/30 rounded px-1 py-0.5">
            INTERNAL
          </span>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <p className="text-[10px] text-white/30 font-mono">Lummy Platform v2</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-white/10 flex items-center px-6 gap-3 bg-[#0d0d1a]">
          <span className="text-sm text-white/40 font-mono">platform.lummy.co/admin</span>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
