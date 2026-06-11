import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { computeCreatorRiskProfile } from "@/lib/creator-success/creator-risk-engine"
import { computeCreatorGrowthProfile } from "@/lib/creator-success/creator-growth-engine"
import { scoreStorefrontOptimization } from "@/lib/creator-success/creator-optimization-engine"
import { computeCreatorLifecycle } from "@/lib/creator-success/creator-lifecycle-engine"
import { getCreatorRecommendations } from "@/lib/intelligence/recommendation-engine"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("id, organization_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!profile?.id) return NextResponse.json({ error: "Creator profile not found" }, { status: 404 })
  const creatorId = (profile as { id: string; organization_id?: string }).id
  const tenantId  = (profile as { id: string; organization_id?: string }).organization_id ?? creatorId

  try {
    const [riskProfile, growthProfile, storefrontScore, lifecycle, recommendations] = await Promise.allSettled([
      computeCreatorRiskProfile(creatorId),
      computeCreatorGrowthProfile(creatorId),
      scoreStorefrontOptimization(creatorId),
      computeCreatorLifecycle(creatorId),
      getCreatorRecommendations(creatorId),
    ])

    return NextResponse.json({
      creatorId,
      risk:          riskProfile.status    === "fulfilled" ? riskProfile.value    : null,
      growth:        growthProfile.status  === "fulfilled" ? growthProfile.value  : null,
      storefront:    storefrontScore.status === "fulfilled" ? storefrontScore.value : null,
      lifecycle:     lifecycle.status      === "fulfilled" ? lifecycle.value      : null,
      recommendations: recommendations.status === "fulfilled" ? recommendations.value : [],
    })
  } catch (err) {
    return NextResponse.json({ error: "Creator intelligence failed", detail: String(err) }, { status: 500 })
  }
}
