import {
  buildRevenueOpportunity,
  persistRevenueOpportunity,
  type AliceOpportunityInput,
  type RevenueOpportunity,
} from "./revenue-opportunity"

export interface AliceDomainSignal {
  organizationId: string
  staleRecalls?: number
  unscheduledTreatmentValue?: number
  openLeads?: number
  reviewDeficit?: number
  referralEligiblePatients?: number
  deniedInsuranceValue?: number
  providerIdleHours?: number
}

function opportunity(input: AliceOpportunityInput): RevenueOpportunity {
  return buildRevenueOpportunity(input)
}

export function detectRevenueOpportunitiesWithAlice(signals: AliceDomainSignal): RevenueOpportunity[] {
  const opportunities: RevenueOpportunity[] = []

  if ((signals.staleRecalls ?? 0) > 0) {
    opportunities.push(opportunity({
      organizationId: signals.organizationId,
      type: "recall",
      estimatedRevenue: (signals.staleRecalls ?? 0) * 250,
      confidence: 76,
      urgency: Math.min(100, (signals.staleRecalls ?? 0) * 8),
      impact: 72,
    }))
  }

  if ((signals.unscheduledTreatmentValue ?? 0) > 0) {
    opportunities.push(opportunity({
      organizationId: signals.organizationId,
      type: "treatment_acceptance",
      estimatedRevenue: signals.unscheduledTreatmentValue ?? 0,
      confidence: 82,
      urgency: 78,
      impact: 88,
    }))
  }

  if ((signals.openLeads ?? 0) > 0) {
    opportunities.push(opportunity({
      organizationId: signals.organizationId,
      type: "lead_conversion",
      estimatedRevenue: (signals.openLeads ?? 0) * 375,
      confidence: 70,
      urgency: 85,
      impact: 74,
    }))
  }

  if ((signals.reviewDeficit ?? 0) > 0) {
    opportunities.push(opportunity({
      organizationId: signals.organizationId,
      type: "review",
      estimatedRevenue: (signals.reviewDeficit ?? 0) * 90,
      confidence: 62,
      urgency: 55,
      impact: 60,
    }))
  }

  if ((signals.referralEligiblePatients ?? 0) > 0) {
    opportunities.push(opportunity({
      organizationId: signals.organizationId,
      type: "referral",
      estimatedRevenue: (signals.referralEligiblePatients ?? 0) * 180,
      confidence: 64,
      urgency: 48,
      impact: 68,
    }))
  }

  if ((signals.deniedInsuranceValue ?? 0) > 0) {
    opportunities.push(opportunity({
      organizationId: signals.organizationId,
      type: "insurance_recovery",
      estimatedRevenue: signals.deniedInsuranceValue ?? 0,
      confidence: 73,
      urgency: 82,
      impact: 86,
    }))
  }

  if ((signals.providerIdleHours ?? 0) > 0) {
    opportunities.push(opportunity({
      organizationId: signals.organizationId,
      type: "provider_utilization",
      estimatedRevenue: (signals.providerIdleHours ?? 0) * 425,
      confidence: 68,
      urgency: 66,
      impact: 80,
    }))
  }

  return opportunities.sort((a, b) => b.score - a.score)
}

export async function persistAliceRevenueOpportunities(signals: AliceDomainSignal) {
  const opportunities = detectRevenueOpportunitiesWithAlice(signals)
  const persisted: RevenueOpportunity[] = []

  for (const opportunity of opportunities) {
    persisted.push(await persistRevenueOpportunity(opportunity))
  }

  return persisted
}
