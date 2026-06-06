import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { OrgDetailClient, type OrgDetailData } from "./org-detail-client"

export const dynamic = "force-dynamic"
export const metadata = { title: "Organization Detail" }

export default async function OrgDetailPage({ params }: { params: { id: string } }) {
  await requireAdminAccess()
  const supabase = createClient()

  // Fetch org with owner and members
  let org: OrgDetailData | null = null
  try {
    const { data: orgData, error } = await supabase
      .from("organizations")
      .select("id, name, slug, status, plan, currency, created_at")
      .eq("id", params.id)
      .maybeSingle()

    if (error || !orgData) {
      // Try slug lookup
      const { data: bySlug } = await supabase
        .from("organizations")
        .select("id, name, slug, status, plan, currency, created_at")
        .eq("slug", params.id)
        .maybeSingle()
      if (!bySlug) return notFound()
      Object.assign(orgData ?? {}, bySlug)
    }

    if (orgData) {
      const [{ data: members }, { data: subscription }, { count: orderCount }, { data: ownerRow }] = await Promise.all([
        supabase
          .from("organization_members")
          .select("id, role, status, profiles:user_id ( full_name, email )")
          .eq("org_id", orgData.id)
          .limit(50),
        supabase
          .from("subscriptions")
          .select("plan, billing_cycle, next_billing_date, amount, currency, status")
          .eq("org_id", orgData.id)
          .maybeSingle(),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgData.id),
        supabase
          .from("organization_members")
          .select("profiles:user_id ( full_name, email, id )")
          .eq("org_id", orgData.id)
          .eq("role", "owner")
          .maybeSingle(),
      ])

      const ownerProfile = (ownerRow as { profiles?: { full_name?: string; email?: string; id?: string } | null } | null)?.profiles

      org = {
        id: orgData.id,
        name: orgData.name ?? "Unnamed",
        slug: orgData.slug ?? orgData.id,
        status: (orgData.status === "suspended" ? "suspended" : "active") as "active" | "suspended",
        plan: orgData.plan ?? "free",
        currency: orgData.currency ?? "USD",
        createdAt: orgData.created_at,
        owner: ownerProfile ? {
          name: ownerProfile.full_name ?? ownerProfile.email ?? "Unknown",
          email: ownerProfile.email ?? "—",
          id: ownerProfile.id ?? "",
        } : null,
        members: ((members ?? []) as unknown as Array<{
          id: string
          role: string
          status: string
          profiles: { full_name?: string; email?: string } | null
        }>).map(m => ({
          id: m.id,
          name: m.profiles?.full_name ?? "Unknown",
          email: m.profiles?.email ?? "—",
          role: (m.role ?? "member").toUpperCase(),
          status: m.status ?? "active",
        })),
        subscription: subscription ? {
          plan: subscription.plan ?? "free",
          billingCycle: subscription.billing_cycle ?? "monthly",
          nextBillingDate: subscription.next_billing_date ?? "—",
          amount: subscription.amount ?? 0,
          currency: subscription.currency ?? "USD",
          status: subscription.status ?? "active",
        } : null,
        stats: {
          totalRevenue: 0,
          totalOrders: orderCount ?? 0,
          activeProducts: 0,
        },
      }
    }
  } catch (err) {
    console.error("[AdminOrgDetail] Error fetching org:", err)
    return notFound()
  }

  if (!org) return notFound()

  return <OrgDetailClient org={org} />
}
