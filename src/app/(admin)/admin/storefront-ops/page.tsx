import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { Store, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Storefront Operations" }

export default async function StorefrontOpsPage() {
  await requireAdminAccess()
  const supabase = createClient()

  // Fetch storefront data from storefronts or creator_profiles
  let storefronts: {
    id: string
    handle: string
    name: string
    status: string
    published: boolean
    createdAt: string
    updatedAt: string
    hasProducts: boolean
    orgId: string
  }[] = []

  let totalStorefronts = 0
  let published = 0
  let unpublished = 0

  try {
    // Try storefronts table first
    const { data: sfData, count, error } = await supabase
      .from("storefronts")
      .select("id, handle, name, status, is_published, created_at, updated_at, org_id", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100)

    if (!error && sfData && sfData.length > 0) {
      totalStorefronts = count ?? 0
      storefronts = sfData.map((s: {
        id: string; handle: string; name?: string; status?: string
        is_published?: boolean; created_at: string; updated_at?: string; org_id?: string
      }) => ({
        id: s.id,
        handle: s.handle ?? "—",
        name: s.name ?? s.handle ?? "Unnamed",
        status: s.status ?? "active",
        published: s.is_published ?? false,
        createdAt: s.created_at,
        updatedAt: s.updated_at ?? s.created_at,
        hasProducts: true, // Would need join for accuracy
        orgId: s.org_id ?? "",
      }))
      published = storefronts.filter(s => s.published).length
      unpublished = storefronts.filter(s => !s.published).length
    } else {
      // Fall back to creator_profiles
      const { data: profiles, count: profileCount } = await supabase
        .from("creator_profiles")
        .select("id, handle, display_name, storefront_published, created_at, updated_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(100)

      if (profiles) {
        totalStorefronts = profileCount ?? 0
        storefronts = profiles.map((p: {
          id: string; handle?: string; display_name?: string
          storefront_published?: boolean; created_at: string; updated_at?: string
        }) => ({
          id: p.id,
          handle: p.handle ?? "—",
          name: p.display_name ?? p.handle ?? "Unnamed",
          status: "active",
          published: p.storefront_published ?? false,
          createdAt: p.created_at,
          updatedAt: p.updated_at ?? p.created_at,
          hasProducts: true,
          orgId: "",
        }))
        published = storefronts.filter(s => s.published).length
        unpublished = storefronts.filter(s => !s.published).length
      }
    }
  } catch (err) {
    console.error("[AdminStorefrontOps] Failed to query storefronts:", err)
  }

  // Detect handle conflicts (handles that appear more than once)
  const handleCounts: Record<string, number> = {}
  storefronts.forEach(s => {
    if (s.handle && s.handle !== "—") handleCounts[s.handle] = (handleCounts[s.handle] ?? 0) + 1
  })
  const conflictHandles = Object.entries(handleCounts).filter(([, count]) => count > 1).map(([handle]) => handle)

  // Storefronts with missing data
  const missingData = storefronts.filter(s => s.handle === "—" || s.name === "Unnamed")

  // Storefront event failures
  let storefrontFailures: { id: string; event_type: string; created_at: string }[] = []
  try {
    const { data: failures } = await supabase
      .from("event_failures")
      .select("id, event_type, created_at")
      .ilike("event_type", "%storefront%")
      .order("created_at", { ascending: false })
      .limit(20)
    if (failures) storefrontFailures = failures as typeof storefrontFailures
  } catch {
    // event_failures table may not exist
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Store className="w-6 h-6 text-[#6C4EF3]" />
          Storefront Operations
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Monitor storefront creation, publication status, handle conflicts, and data integrity.
        </p>
      </div>

      {conflictHandles.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">
            <strong>{conflictHandles.length} handle conflict{conflictHandles.length > 1 ? "s" : ""} detected:</strong>{" "}
            {conflictHandles.map(h => `/${h}`).join(", ")}
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total storefronts", value: totalStorefronts },
          { label: "Published", value: published },
          { label: "Unpublished", value: unpublished },
          { label: "Handle conflicts", value: conflictHandles.length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">{label}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Issue list */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">Operational Issues</h2>
        <div className="space-y-3">
          {missingData.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-400">Missing store data</p>
                <p className="text-xs text-amber-400/70 mt-0.5">{missingData.length} storefront{missingData.length > 1 ? "s" : ""} with incomplete handle or name data.</p>
              </div>
            </div>
          )}
          {storefrontFailures.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-400">Storefront event failures</p>
                <p className="text-xs text-red-400/70 mt-0.5">{storefrontFailures.length} storefront-related event failures detected in event_failures log.</p>
              </div>
            </div>
          )}
          {conflictHandles.length === 0 && missingData.length === 0 && storefrontFailures.length === 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-sm text-emerald-400">No storefront issues detected.</p>
            </div>
          )}
        </div>
      </section>

      {/* Storefront table */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">All Storefronts ({totalStorefronts})</h2>
        {storefronts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-sm text-white/30">No storefront records found in database.</p>
            <p className="text-xs text-white/20 mt-1 font-mono">storefronts / creator_profiles table returned 0 rows</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Handle</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Published</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Created</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Last updated</th>
                </tr>
              </thead>
              <tbody>
                {storefronts.map(sf => (
                  <tr key={sf.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${conflictHandles.includes(sf.handle) ? "bg-red-500/5" : ""}`}>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[#6C4EF3]">/{sf.handle}</span>
                        {conflictHandles.includes(sf.handle) && <AlertTriangle className="w-3 h-3 text-red-400" />}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-white/70">{sf.name}</td>
                    <td className="py-2.5 px-4">
                      {sf.published ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-[10px]"><CheckCircle2 className="w-3 h-3" />Live</span>
                      ) : (
                        <span className="flex items-center gap-1 text-white/30 text-[10px]"><XCircle className="w-3 h-3" />Draft</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-white/40">{new Date(sf.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-4 text-white/40">{new Date(sf.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
