import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export type AdminRole = "super_admin" | "platform_admin"

export async function requireAdminAccess(): Promise<{ userId: string; role: AdminRole }> {
  const supabase = createClient()

  let user
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    redirect("/login?next=/admin")
  }

  if (!user) redirect("/login?next=/admin")

  type ProfileRow = { role?: string | null; is_admin?: boolean | null }
  let profile: ProfileRow | null = null
  try {
    const { data } = await supabase
      .from("profiles")
      .select("role, is_admin")
      .eq("id", user.id)
      .maybeSingle()
    profile = data as ProfileRow | null
  } catch {
    // Profile fetch failed — deny access rather than granting it
    redirect("/dashboard")
  }

  const role = profile?.role
  const isAdmin = profile?.is_admin

  if (role === "super_admin") return { userId: user.id, role: "super_admin" }
  if (role === "platform_admin" || isAdmin === true) return { userId: user.id, role: "platform_admin" }

  redirect("/dashboard")
}
