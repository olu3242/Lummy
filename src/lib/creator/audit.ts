import { createAdminClient } from "@/lib/supabase/server"
import { trackFunnelEvent } from "@/lib/analytics/funnel"

export type FrictionPoint =
  | "signup_form_error"
  | "onboarding_step_back"
  | "onboarding_abandoned"
  | "upload_failed"
  | "publish_failed"
  | "checkout_abandoned"
  | "payment_failed"
  | "whatsapp_link_broken"

export interface FrictionEvent {
  point: FrictionPoint
  creatorId?: string
  userId?: string
  detail?: string
  step?: string
}

export async function trackFriction(event: FrictionEvent): Promise<void> {
  // Reuse funnel infrastructure — map friction to closest funnel event for now
  // and store detail in properties
  try {
    await trackFunnelEvent("checkout_started", {
      creatorId: event.creatorId,
      userId: event.userId,
      properties: {
        friction_point: event.point,
        friction_detail: event.detail ?? null,
        friction_step: event.step ?? null,
      },
    })
  } catch {
    // Never throw from analytics
  }
}

export interface OnboardingAudit {
  creatorId: string
  completedSteps: string[]
  missingSteps: string[]
  frictionScore: number   // 0 = smooth, 100 = max friction
  recommendations: string[]
}

const ONBOARDING_STEPS = [
  { key: "has_handle",      label: "Store handle set",      query: "handle" },
  { key: "has_whatsapp",    label: "WhatsApp connected",    query: "whatsapp_number" },
  { key: "has_bio",         label: "Bio written",           query: "bio" },
  { key: "has_avatar",      label: "Avatar uploaded",       query: "avatar_url" },
  { key: "has_product",     label: "First product added",   query: "first_product_added_at" },
  { key: "is_published",    label: "Store published",       query: "is_published" },
  { key: "has_first_sale",  label: "First sale made",       query: "first_sale_at" },
]

export async function auditCreatorOnboarding(creatorId: string): Promise<OnboardingAudit> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("creator_profiles")
    .select("handle, whatsapp_number, bio, avatar_url, first_product_added_at, is_published, first_sale_at")
    .eq("id", creatorId)
    .maybeSingle()

  const p = data as Record<string, unknown> | null

  const completed: string[] = []
  const missing: string[] = []

  for (const step of ONBOARDING_STEPS) {
    const val = p?.[step.query]
    const done = val !== null && val !== undefined && val !== false && val !== ""
    if (done) completed.push(step.label)
    else missing.push(step.label)
  }

  const frictionScore = Math.round((missing.length / ONBOARDING_STEPS.length) * 100)

  const recommendations: string[] = []
  if (missing.includes("WhatsApp connected")) recommendations.push("Add WhatsApp — #1 conversion driver")
  if (missing.includes("Store published")) recommendations.push("Publish store to get discovered")
  if (missing.includes("First product added")) recommendations.push("Add at least one product")
  if (missing.includes("Avatar uploaded")) recommendations.push("Upload a profile photo — builds trust")

  return { creatorId, completedSteps: completed, missingSteps: missing, frictionScore, recommendations }
}

export interface OnboardingDropOffSummary {
  step: string
  creatorsStuck: number
  pctOfTotal: number
}

export async function getOnboardingDropOffSummary(): Promise<OnboardingDropOffSummary[]> {
  const supabase = createAdminClient()
  const { data, count } = await supabase
    .from("creator_profiles")
    .select("handle, whatsapp_number, bio, avatar_url, first_product_added_at, is_published, first_sale_at", {
      count: "exact",
    })
    .limit(500)

  if (!data || !count) return []

  const rows = data as Array<{
    handle: string | null; whatsapp_number: string | null; bio: string | null
    avatar_url: string | null; first_product_added_at: string | null
    is_published: boolean; first_sale_at: string | null
  }>

  const summary: OnboardingDropOffSummary[] = [
    {
      step: "Added WhatsApp",
      creatorsStuck: rows.filter(r => !r.whatsapp_number).length,
      pctOfTotal: 0,
    },
    {
      step: "Added first product",
      creatorsStuck: rows.filter(r => !r.first_product_added_at).length,
      pctOfTotal: 0,
    },
    {
      step: "Published store",
      creatorsStuck: rows.filter(r => !r.is_published).length,
      pctOfTotal: 0,
    },
    {
      step: "Made first sale",
      creatorsStuck: rows.filter(r => !r.first_sale_at).length,
      pctOfTotal: 0,
    },
  ]

  return summary.map(s => ({ ...s, pctOfTotal: Math.round(s.creatorsStuck / count * 100) }))
}
