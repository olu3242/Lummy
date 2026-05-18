import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { computeMonetizationScorecard } from "@/lib/creator/monetization-scorecard"
import { getEcosystemParticipationScore } from "@/lib/ecosystem/participation"
import { getFirstSaleReadiness } from "@/lib/creator/first-sale"

async function resolveCreatorId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from("creator_profiles").select("id").eq("user_id", userId).maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const creatorId = await resolveCreatorId(user.id)
  if (!creatorId) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const [scorecard, ecosystem, firstSale] = await Promise.allSettled([
    computeMonetizationScorecard(creatorId),
    getEcosystemParticipationScore(creatorId),
    getFirstSaleReadiness(creatorId),
  ])

  return NextResponse.json({
    scorecard: scorecard.status === "fulfilled" ? scorecard.value : null,
    ecosystem: ecosystem.status === "fulfilled" ? ecosystem.value : null,
    firstSale: firstSale.status === "fulfilled" ? firstSale.value : null,
  })
}
