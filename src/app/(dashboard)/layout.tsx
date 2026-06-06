import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayoutClient } from "./dashboard-layout-client"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    redirect("/login")
  }

  if (!user) redirect("/login")

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
