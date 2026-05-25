import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { computeEcosystemHealthReport } from "@/lib/ecosystem-intelligence/ecosystem-health-engine"
import { analyzeCreatorRetentionCohorts } from "@/lib/marketplace-intelligence/retention-intelligence-engine"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const [ecosystemHealth, retention] = await Promise.allSettled([
      computeEcosystemHealthReport(),
      analyzeCreatorRetentionCohorts(3),
    ])

    // Fetch recent ecosystem health snapshots from marketplace_health_snapshots
    const admin = (await import("@/lib/supabase/server")).createAdminClient()
    const { data: snapshots } = await admin
      .from("marketplace_health_snapshots")
      .select("snapshot_date, overall_score, retention_score, conversion_score, signals")
      .eq("creator_type", "platform")
      .order("snapshot_date", { ascending: false })
      .limit(30)

    return NextResponse.json({
      health:    ecosystemHealth.status === "fulfilled" ? ecosystemHealth.value : null,
      retention: retention.status       === "fulfilled" ? retention.value       : null,
      history:   snapshots ?? [],
    })
  } catch (err) {
    return NextResponse.json({ error: "Ecosystem intelligence failed", detail: String(err) }, { status: 500 })
  }
}
