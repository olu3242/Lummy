import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export type AdminRole = "super_admin" | "platform_admin"

export async function requireAdminAccess(): Promise<{ userId: string; role: AdminRole }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/admin")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .maybeSingle()

  const role = (profile as { role?: string; is_admin?: boolean } | null)?.role
  const isAdmin = (profile as { role?: string; is_admin?: boolean } | null)?.is_admin

  if (role === "super_admin") return { userId: user.id, role: "super_admin" }
  if (role === "platform_admin" || isAdmin) return { userId: user.id, role: "platform_admin" }

  redirect("/dashboard")
}
