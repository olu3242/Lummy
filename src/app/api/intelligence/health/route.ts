import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { computeOperationalHealthReport } from "@/lib/intelligence/operational-health-intelligence"
import { computeRuntimeCongestion } from "@/lib/intelligence/workflow-intelligence"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  // Auth check
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const congestion = await computeRuntimeCongestion()
    const report     = await computeOperationalHealthReport(congestion)

    // Also fetch latest snapshot for trend
    const admin = (await import("@/lib/supabase/server")).createAdminClient()
    const { data: snapshots } = await admin
      .from("operational_intelligence_snapshots")
      .select("snapshot_type, score, signals, created_at")
      .eq("snapshot_type", "runtime_health")
      .order("created_at", { ascending: false })
      .limit(7)

    return NextResponse.json({
      report,
      congestion,
      historicalScores: snapshots ?? [],
    })
  } catch (err) {
    return NextResponse.json({ error: "Intelligence health check failed", detail: String(err) }, { status: 500 })
  }
}
