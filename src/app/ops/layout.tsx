import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Ops Console — Lummy",
  robots: { index: false, follow: false },
}

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Restrict to admin/ops roles — profiles with is_admin flag or ops_access
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .maybeSingle()

  const hasOpsAccess =
    (profile as { is_admin?: boolean; role?: string } | null)?.is_admin === true ||
    (profile as { is_admin?: boolean; role?: string } | null)?.role === "admin" ||
    (profile as { is_admin?: boolean; role?: string } | null)?.role === "ops"

  if (!hasOpsAccess) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 h-12 flex items-center px-4 border-b border-border bg-background/90 backdrop-blur-sm">
        <span className="font-mono text-xs font-semibold text-muted-foreground tracking-widest uppercase">
          Lummy Ops Console
        </span>
        <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20 uppercase tracking-wider">
          Internal
        </span>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
