import { createAdminClient } from "@/lib/supabase/server"

export type RevenueOpportunityType =
  | "recall"
  | "treatment_acceptance"
  | "lead_conversion"
  | "review"
  | "referral"
  | "insurance_recovery"
  | "provider_utilization"

export type RevenueOpportunityPriority = "low" | "medium" | "high" | "critical"
export type RevenueOpportunityStatus = "detected" | "assigned" | "in_progress" | "won" | "lost" | "dismissed"

export interface RevenueOpportunity {
  id: string
  organization_id: string
  type: RevenueOpportunityType
  score: number
  estimated_revenue: number
  confidence: number
  priority: RevenueOpportunityPriority
  recommended_workflow: string
  status: RevenueOpportunityStatus
}

export interface AliceOpportunityInput {
  organizationId: string
  type: RevenueOpportunityType
  estimatedRevenue: number
  confidence: number
  urgency: number
  impact: number
  recommendedWorkflow?: string
  status?: RevenueOpportunityStatus
}

export const ALICE_WORKFLOW_ASSIGNMENTS: Record<RevenueOpportunityType, string> = {
  recall: "recall.reactivation",
  treatment_acceptance: "treatment.acceptance.recovery",
  lead_conversion: "lead.conversion.acceleration",
  review: "review.generation",
  referral: "referral.activation",
  insurance_recovery: "insurance.recovery",
  provider_utilization: "provider.schedule.optimization",
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function scoreRevenueOpportunity(input: Pick<AliceOpportunityInput, "confidence" | "urgency" | "impact" | "estimatedRevenue">): number {
  const revenueWeight = Math.min(100, Math.log10(Math.max(1, input.estimatedRevenue)) * 18)
  return clampScore(
    input.confidence * 0.35 +
    input.urgency * 0.25 +
    input.impact * 0.25 +
    revenueWeight * 0.15,
  )
}

export function priorityFromScore(score: number): RevenueOpportunityPriority {
  if (score >= 85) return "critical"
  if (score >= 70) return "high"
  if (score >= 45) return "medium"
  return "low"
}

export function buildRevenueOpportunity(input: AliceOpportunityInput): RevenueOpportunity {
  const score = scoreRevenueOpportunity(input)

  return {
    id: `alice_${input.organizationId}_${input.type}`,
    organization_id: input.organizationId,
    type: input.type,
    score,
    estimated_revenue: Math.max(0, Math.round(input.estimatedRevenue)),
    confidence: clampScore(input.confidence),
    priority: priorityFromScore(score),
    recommended_workflow: input.recommendedWorkflow ?? ALICE_WORKFLOW_ASSIGNMENTS[input.type],
    status: input.status ?? "detected",
  }
}

export async function persistRevenueOpportunity(opportunity: RevenueOpportunity) {
  const supabase = createAdminClient()
  const result = await supabase
    .from("revenue_opportunities")
    .upsert(opportunity, { onConflict: "organization_id,type,recommended_workflow,status" })
    .select("*")
    .single()

  if (result.error) throw result.error
  return result.data as RevenueOpportunity
}

export async function listRevenueOpportunities(organizationId: string): Promise<RevenueOpportunity[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("revenue_opportunities")
    .select("id,organization_id,type,score,estimated_revenue,confidence,priority,recommended_workflow,status")
    .eq("organization_id", organizationId)
    .order("score", { ascending: false })

  if (error) throw error
  return (data ?? []) as RevenueOpportunity[]
}
