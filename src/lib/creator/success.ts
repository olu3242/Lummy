import { createAdminClient } from "@/lib/supabase/server"
import { getCreatorRetentionSignals } from "@/lib/growth/retention"
import { getCreatorRecommendations } from "@/lib/ai/recommendations"
import { auditConversionReadiness } from "@/lib/ai/conversion"
import { auditCreatorOnboarding } from "./audit"

export interface CreatorSuccessSnapshot {
  creatorId: string
  activationScore: number      // 0-100 from health scoring
  onboardingComplete: boolean
  conversionScore: number      // 0-100 from audit
  topRecommendation: string
  riskFlags: string[]
  nextAction: string
  nextActionUrl: string
}

export async function getCreatorSuccessSnapshot(creatorId: string): Promise<CreatorSuccessSnapshot> {
  const supabase = createAdminClient()

  const [profileRes, signals, onboarding] = await Promise.all([
    supabase.from("creator_profiles")
      .select("bio, avatar_url, whatsapp_number, is_published, onboarding_completed")
      .eq("id", creatorId)
      .maybeSingle(),
    getCreatorRetentionSignals(creatorId),
    auditCreatorOnboarding(creatorId),
  ])

  const profile = profileRes.data as {
    bio: string | null; avatar_url: string | null; whatsapp_number: string | null;
    is_published: boolean; onboarding_completed: boolean
  } | null

  const audit = auditConversionReadiness({
    hasWhatsApp: !!profile?.whatsapp_number,
    isPublished: profile?.is_published ?? false,
    productCount: signals.productCount,
    hasBio: !!profile?.bio,
    hasAvatar: !!profile?.avatar_url,
    hasCustomDomain: false,
  })

  const recs = getCreatorRecommendations(signals)
  const top = recs[0]

  const activationSteps = [
    !!profile?.onboarding_completed,
    signals.productCount > 0,
    profile?.is_published ?? false,
    !!profile?.whatsapp_number,
    signals.daysSinceLastOrder === 0,
  ]
  const activationScore = Math.round(activationSteps.filter(Boolean).length / activationSteps.length * 100)

  return {
    creatorId,
    activationScore,
    onboardingComplete: profile?.onboarding_completed ?? false,
    conversionScore: audit.score,
    topRecommendation: audit.topRecommendation,
    riskFlags: signals.riskFlags,
    nextAction: top?.title ?? "Keep growing!",
    nextActionUrl: top?.ctaUrl ?? "/dashboard",
  }
}

export interface CreatorSuccessBatch {
  totalCreators: number
  fullyActivated: number
  partiallyActivated: number
  notStarted: number
  avgActivationScore: number
  topDropOffPoint: string
}

export async function getBatchSuccessMetrics(): Promise<CreatorSuccessBatch> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("creator_profiles")
    .select("onboarding_completed, is_published, first_product_added_at, first_sale_at, whatsapp_number")
    .limit(500)

  if (!data) return {
    totalCreators: 0, fullyActivated: 0, partiallyActivated: 0,
    notStarted: 0, avgActivationScore: 0, topDropOffPoint: "signup",
  }

  const rows = data as Array<{
    onboarding_completed: boolean; is_published: boolean
    first_product_added_at: string | null; first_sale_at: string | null
    whatsapp_number: string | null
  }>

  let totalScore = 0
  let fullyActivated = 0
  let notStarted = 0

  for (const r of rows) {
    const steps = [
      r.onboarding_completed,
      !!r.first_product_added_at,
      r.is_published,
      !!r.whatsapp_number,
    ]
    const score = Math.round(steps.filter(Boolean).length / steps.length * 100)
    totalScore += score
    if (score === 100) fullyActivated++
    if (score === 0) notStarted++
  }

  const partiallyActivated = rows.length - fullyActivated - notStarted

  // Find where most creators drop off
  const noWhatsApp = rows.filter(r => !r.whatsapp_number).length
  const noProduct = rows.filter(r => !r.first_product_added_at).length
  const notPublished = rows.filter(r => !r.is_published).length
  const maxDrop = Math.max(noWhatsApp, noProduct, notPublished)
  const topDropOffPoint =
    maxDrop === noWhatsApp ? "Adding WhatsApp" :
    maxDrop === noProduct ? "Adding first product" :
    "Publishing store"

  return {
    totalCreators: rows.length,
    fullyActivated,
    partiallyActivated,
    notStarted,
    avgActivationScore: rows.length > 0 ? Math.round(totalScore / rows.length) : 0,
    topDropOffPoint,
  }
}
