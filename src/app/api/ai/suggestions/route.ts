import { NextResponse, type NextRequest } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { generateStorefrontSuggestions } from "@/lib/ai/commerce"
import { getCreatorRecommendations } from "@/lib/ai/recommendations"
import { auditConversionReadiness } from "@/lib/ai/conversion"
import { getCreatorRetentionSignals } from "@/lib/growth/retention"
import { checkRateLimit, getRateLimitKey } from "@/lib/security/rate-limit"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rlKey = getRateLimitKey("ai_suggestions", request, user.id)
  const rl = checkRateLimit(rlKey, 10)
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("creator_profiles")
    .select("id, display_name, niche, bio, avatar_url, whatsapp_number, is_published, handle")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const p = profile as {
    id: string; display_name: string; niche: string | null; bio: string | null
    avatar_url: string | null; whatsapp_number: string | null
    is_published: boolean; handle: string
  }

  const { data: products } = await admin
    .from("products")
    .select("name")
    .eq("creator_id", p.id)
    .eq("is_published", true)
    .limit(5)

  const signals = await getCreatorRetentionSignals(p.id)

  const [storefront, recs, audit] = await Promise.all([
    generateStorefrontSuggestions({
      creatorName: p.display_name,
      niche: p.niche ?? "general",
      currentBio: p.bio ?? undefined,
      productNames: (products as { name: string }[] | null)?.map(r => r.name) ?? [],
    }),
    Promise.resolve(getCreatorRecommendations(signals)),
    Promise.resolve(auditConversionReadiness({
      hasWhatsApp: !!p.whatsapp_number,
      isPublished: p.is_published,
      productCount: signals.productCount,
      hasBio: !!p.bio,
      hasAvatar: !!p.avatar_url,
      hasCustomDomain: false,
    })),
  ])

  return NextResponse.json({ storefront, recommendations: recs, audit })
}
