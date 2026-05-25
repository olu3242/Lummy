import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { computeMarketplaceHealthScore } from "@/lib/marketplace-intelligence/marketplace-health-engine"
import { analyzeConversionBottlenecks } from "@/lib/marketplace-intelligence/conversion-acceleration-engine"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const [health, conversion] = await Promise.allSettled([
      computeMarketplaceHealthScore(),
      analyzeConversionBottlenecks(),
    ])

    // Fetch recent marketplace health snapshots
    const admin = (await import("@/lib/supabase/server")).createAdminClient()
    const { data: snapshots } = await admin
      .from("marketplace_health_snapshots")
      .select("snapshot_date, overall_score, signals")
      .order("snapshot_date", { ascending: false })
      .limit(7)

    return NextResponse.json({
      health:     health.status     === "fulfilled" ? health.value     : null,
      conversion: conversion.status === "fulfilled" ? conversion.value : null,
      history:    snapshots ?? [],
    })
  } catch (err) {
    return NextResponse.json({ error: "Marketplace intelligence failed", detail: String(err) }, { status: 500 })
  }
}
