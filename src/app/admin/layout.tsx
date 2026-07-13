import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Admin Console - Lummy",
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .maybeSingle()

  const role = (profile as { is_admin?: boolean; role?: string } | null)?.role
  const hasAccess = (profile as { is_admin?: boolean } | null)?.is_admin === true || role === "admin" || role === "ops"
  if (!hasAccess) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 flex h-12 items-center border-b border-border bg-background/90 px-4 backdrop-blur-sm">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Lummy Admin Console
        </span>
        <span className="ml-3 rounded border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
          Internal
        </span>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
