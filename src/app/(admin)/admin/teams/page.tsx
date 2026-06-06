import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { TeamsClient, type OrgMember } from "./teams-client"

export const dynamic = "force-dynamic"
export const metadata = { title: "Teams" }

const FALLBACK_MEMBERS: OrgMember[] = []

export default async function TeamsPage() {
  await requireAdminAccess()
  const supabase = createClient()

  let members: OrgMember[] = FALLBACK_MEMBERS
  try {
    const { data, error } = await supabase
      .from("organization_members")
      .select(`
        id,
        role,
        status,
        created_at,
        profiles:user_id ( id, full_name, email ),
        organizations:org_id ( id, name )
      `)
      .order("created_at", { ascending: false })
      .limit(200)

    if (!error && data && data.length > 0) {
      members = (data as unknown as Array<{
        id: string
        role: string
        status: string
        created_at: string
        profiles: { id?: string; full_name?: string; email?: string } | null
        organizations: { id?: string; name?: string } | null
      }>).map(row => ({
        id: row.id,
        name: row.profiles?.full_name ?? "Unknown",
        email: row.profiles?.email ?? "—",
        role: (row.role ?? "TEAM_MEMBER").toUpperCase(),
        org: row.organizations?.name ?? "—",
        orgId: row.organizations?.id ?? "",
        status: row.status ?? "active",
        joinedAt: row.created_at,
        lastActive: "—",
      }))
    }
  } catch (err) {
    console.error("[AdminTeams] Failed to fetch members:", err)
  }

  return <TeamsClient initialMembers={members} />
}
