import { NextResponse, type NextRequest } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getTrendingCreators, getCreatorsByNiche, getSocialConversionStats, trackCampaignClick } from "@/lib/discovery/ranking"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action") ?? "trending"
  const niche = searchParams.get("niche")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50)

  if (action === "trending") {
    const creators = await getTrendingCreators(limit)
    return NextResponse.json({ creators })
  }

  if (action === "by_niche") {
    if (!niche) return NextResponse.json({ error: "niche required" }, { status: 400 })
    const creators = await getCreatorsByNiche(niche, limit)
    return NextResponse.json({ creators })
  }

  if (action === "conversion_stats") {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    const creatorId = (profile as { id: string } | null)?.id
    if (!creatorId) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

    const stats = await getSocialConversionStats(creatorId)
    return NextResponse.json(stats)
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { creatorId, source, medium, campaignId, utmContent } = body as {
    creatorId?: string; source?: string; medium?: string; campaignId?: string; utmContent?: string
  }

  if (!creatorId || !source) {
    return NextResponse.json({ error: "creatorId and source required" }, { status: 400 })
  }

  await trackCampaignClick({ creatorId, source, medium, campaignId, utmContent })
  return NextResponse.json({ ok: true })
}
