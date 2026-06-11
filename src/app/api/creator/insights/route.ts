import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getCreatorRevenueSummary, getRevenueOpportunities } from "@/lib/revenue/intelligence"
import { computeEngagementScore } from "@/lib/creator/engagement"
import { computeChurnRisk } from "@/lib/creator/churn"
import { auditConversionReadiness } from "@/lib/ai/conversion"
import { getCreatorRetentionSignals } from "@/lib/growth/retention"
import { checkRateLimit, getRateLimitKey } from "@/lib/security/rate-limit"

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rl = checkRateLimit(getRateLimitKey("creator_insights", request as Parameters<typeof getRateLimitKey>[1], user.id), 20)
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("creator_profiles")
    .select("id, bio, avatar_url, whatsapp_number, is_published")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const p = profile as {
    id: string; bio: string | null; avatar_url: string | null;
    whatsapp_number: string | null; is_published: boolean
  }

  const [revenue, opps, engagement, churn, signals] = await Promise.all([
    getCreatorRevenueSummary(p.id),
    getRevenueOpportunities(p.id),
    computeEngagementScore(p.id),
    computeChurnRisk(p.id),
    getCreatorRetentionSignals(p.id),
  ])

  const conversionAudit = auditConversionReadiness({
    hasWhatsApp: !!p.whatsapp_number,
    isPublished: p.is_published,
    productCount: signals.productCount,
    hasBio: !!p.bio,
    hasAvatar: !!p.avatar_url,
    hasCustomDomain: false,
  })

  return NextResponse.json({
    revenue,
    opportunities: opps,
    engagement: {
      score: engagement.score,
      streakDays: engagement.streakDays,
      momentumTrend: engagement.momentumTrend,
      lastActiveAt: engagement.lastActiveAt,
    },
    churnRisk: {
      riskScore: churn.riskScore,
      riskTier: churn.riskTier,
      signals: churn.signals,
    },
    conversion: conversionAudit,
  })
}
