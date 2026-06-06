// Agent OS Runtime — all agent execution flows through here
// No agent executes directly. No direct DB access outside intelligence.ts.

import { createAdminClient } from '@/lib/supabase/server'
import { type AgentName, AGENTS } from './registry'
import {
  analyzeRevenueTrend, detectPaymentAnomalies, detectWebhookAnomalies,
  analyzeActivationFunnel, analyzePayoutStatus, analyzeProductPerformance,
  computeStoreHealthScore, computeCreatorSuccessScore, getRevenuePipeline,
} from './intelligence'

export interface AgentTrigger {
  type: 'on_demand' | 'event' | 'scheduled'
  eventType?: string
  source?: string
}

export interface AgentRecommendation {
  type: string
  title: string
  description: string
  confidence: number
  impactScore: number
}

export interface AgentRunResult {
  agentName: AgentName
  organizationId: string
  decision: string
  confidence: number
  recommendations: AgentRecommendation[]
  insights: { type: string; summary: string; severity: 'info' | 'warning' | 'critical' }[]
  storeHealth?: number
  successScore?: number
}

// ── Org Context Helper ────────────────────────────────────────────────────────

async function getOrgId(supabase: ReturnType<typeof createAdminClient>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return data?.organization_id ?? null
}

// ── Audit Writer ─────────────────────────────────────────────────────────────

async function writeAudit(entry: {
  agentName: string
  organizationId: string | null
  input: Record<string, unknown>
  decision: string
  confidence: number
  actionTaken: string
  result: Record<string, unknown>
}) {
  try {
    const admin = createAdminClient()
    await admin.from('agent_audit_logs').insert({
      agent_name: entry.agentName,
      organization_id: entry.organizationId,
      input: entry.input,
      decision: entry.decision,
      confidence: entry.confidence,
      action_taken: entry.actionTaken,
      result: entry.result,
    })
  } catch { /* audit failures must never break the main flow */ }
}

// ── Recommendation Writer ────────────────────────────────────────────────────

async function persistRecommendations(orgId: string, agentName: string, recs: AgentRecommendation[]) {
  if (recs.length === 0) return
  try {
    const admin = createAdminClient()
    // Deduplicate: remove active recommendations from same agent in last 24h
    await admin
      .from('agent_recommendations')
      .update({ status: 'dismissed' })
      .eq('agent_name', agentName)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .lt('created_at', new Date(Date.now() - 24 * 3600000).toISOString())

    await admin.from('agent_recommendations').insert(
      recs.map(r => ({
        agent_name: agentName,
        organization_id: orgId,
        recommendation_type: r.type,
        title: r.title,
        description: r.description,
        confidence: r.confidence,
        impact_score: r.impactScore,
        status: 'active',
      }))
    )
  } catch { /* non-fatal */ }
}

// ── Insight Writer ────────────────────────────────────────────────────────────

async function persistInsights(orgId: string, insights: AgentRunResult['insights']) {
  if (insights.length === 0) return
  try {
    const admin = createAdminClient()
    await admin.from('agent_insights').insert(
      insights.map(i => ({
        organization_id: orgId,
        insight_type: i.type,
        summary: i.summary,
        severity: i.severity,
        confidence: 0.85,
      }))
    )
  } catch { /* non-fatal */ }
}

// ── Core Agent Runners ───────────────────────────────────────────────────────

async function runNOVA(orgId: string): Promise<AgentRunResult> {
  const [trend, pipeline, healthResult, successResult, activation] = await Promise.all([
    analyzeRevenueTrend(orgId),
    getRevenuePipeline(orgId),
    computeStoreHealthScore(orgId),
    computeCreatorSuccessScore(orgId),
    analyzeActivationFunnel(orgId),
  ])

  const recs: AgentRecommendation[] = []
  const insights: AgentRunResult['insights'] = []

  if (trend.direction === 'declining') {
    recs.push({
      type: 'revenue_recovery',
      title: `Revenue down ${Math.abs(trend.changePercent)}% this week`,
      description: `Your revenue dropped from ${Math.round(trend.previous).toLocaleString()} to ${Math.round(trend.current).toLocaleString()} in the last 7 days. Consider running a promotion or reaching out to past customers.`,
      confidence: trend.confidence,
      impactScore: 85,
    })
    insights.push({ type: 'revenue_decline', summary: `Revenue declined ${Math.abs(trend.changePercent)}% week-over-week`, severity: 'warning' })
  }

  if (pipeline.pendingOrders > 3) {
    recs.push({
      type: 'pending_orders',
      title: `${pipeline.pendingOrders} orders awaiting fulfillment`,
      description: 'You have pending orders. Follow up with customers to confirm or fulfill these orders.',
      confidence: 0.95,
      impactScore: 70,
    })
  }

  if (!activation.hasPayoutAccount) {
    recs.push({
      type: 'payout_setup',
      title: 'Link your bank account to receive payouts',
      description: 'You have not linked a bank account yet. Go to Settings → Payments to add your bank details.',
      confidence: 0.99,
      impactScore: 90,
    })
  }

  if (!activation.hasProducts) {
    recs.push({
      type: 'add_products',
      title: 'Add your first product to start selling',
      description: 'Your store has no products. Create a product to start receiving orders.',
      confidence: 0.99,
      impactScore: 100,
    })
  }

  const decision = trend.direction === 'improving' ? 'Store is growing — maintain momentum'
    : trend.direction === 'declining' ? 'Revenue declining — recovery actions recommended'
    : 'Revenue stable — optimize for growth'

  return {
    agentName: 'NOVA',
    organizationId: orgId,
    decision,
    confidence: trend.confidence,
    recommendations: recs,
    insights,
    storeHealth: healthResult.score,
    successScore: successResult.score,
  }
}

async function runATLAS(orgId: string): Promise<AgentRunResult> {
  const [anomalies, pipeline] = await Promise.all([
    detectPaymentAnomalies(orgId),
    getRevenuePipeline(orgId),
  ])

  const recs: AgentRecommendation[] = []
  const insights: AgentRunResult['insights'] = []

  for (const anomaly of anomalies) {
    insights.push({ type: anomaly.type, summary: anomaly.description, severity: anomaly.severity })
    if (anomaly.type === 'high_failure_rate') {
      recs.push({
        type: 'payment_failure',
        title: `High payment failure rate: ${anomaly.value}%`,
        description: `${anomaly.value}% of payments are failing. Check if Paystack or Stripe is configured correctly. Review declined card messages in your payment dashboard.`,
        confidence: 0.90,
        impactScore: 95,
      })
    }
    if (anomaly.type === 'payment_gap') {
      recs.push({
        type: 'payment_gap',
        title: 'No successful payments in 7 days',
        description: 'Your store was previously active but has had no successful payments this week. Verify your payment provider is configured and your storefront is published.',
        confidence: 0.80,
        impactScore: 85,
      })
    }
  }

  if (pipeline.paymentSuccessRate < 0.7 && pipeline.totalOrders > 0) {
    recs.push({
      type: 'low_success_rate',
      title: `Payment success rate is ${Math.round(pipeline.paymentSuccessRate * 100)}%`,
      description: 'More than 30% of checkout attempts are not completing. Consider testing your checkout flow and contacting Paystack support.',
      confidence: 0.85,
      impactScore: 80,
    })
  }

  const decision = anomalies.length > 0 ? `${anomalies.length} payment anomaly detected — immediate review required`
    : pipeline.paymentSuccessRate >= 0.9 ? 'Payment system healthy'
    : 'Payment reliability below target'

  return { agentName: 'ATLAS', organizationId: orgId, decision, confidence: 0.87, recommendations: recs, insights }
}

async function runTREASURY(orgId: string): Promise<AgentRunResult> {
  const status = await analyzePayoutStatus(orgId)
  const recs: AgentRecommendation[] = []
  const insights: AgentRunResult['insights'] = []

  if (!status.hasPayoutAccount) {
    recs.push({
      type: 'no_payout_account',
      title: 'No bank account linked',
      description: 'You cannot withdraw your earnings until you link a bank account. Go to Settings → Payments.',
      confidence: 0.99,
      impactScore: 100,
    })
  } else if (status.available > 5000) {
    recs.push({
      type: 'withdrawal_available',
      title: `${Math.round(status.available).toLocaleString()} available for withdrawal`,
      description: 'You have funds available. Visit the Payouts page to request a withdrawal.',
      confidence: 0.95,
      impactScore: 75,
    })
  }

  if (status.pendingCount > 0) {
    insights.push({ type: 'pending_payout', summary: `${status.pendingCount} payout request pending admin approval`, severity: 'info' })
  }

  const decision = !status.hasPayoutAccount ? 'No bank account — payout blocked'
    : status.available > 0 ? `${Math.round(status.available).toLocaleString()} available for withdrawal`
    : 'No available balance'

  return { agentName: 'TREASURY', organizationId: orgId, decision, confidence: 0.95, recommendations: recs, insights }
}

async function runPULSE(_orgId: string): Promise<AgentRunResult> {
  const anomalies = await detectWebhookAnomalies()
  const recs: AgentRecommendation[] = []
  const insights: AgentRunResult['insights'] = []

  for (const anomaly of anomalies) {
    insights.push({ type: anomaly.type, summary: anomaly.description, severity: anomaly.severity })
    recs.push({
      type: 'webhook_failure',
      title: `Webhook failure spike detected`,
      description: `${anomaly.description}. Check your Paystack/Stripe webhook configuration and ensure the webhook signing secret is correctly set in environment variables.`,
      confidence: 0.85,
      impactScore: 90,
    })
  }

  const decision = anomalies.length > 0 ? 'Webhook anomalies detected — operational review required'
    : 'Operations nominal'

  return { agentName: 'PULSE', organizationId: _orgId, decision, confidence: 0.88, recommendations: recs, insights }
}

async function runMERCHANT(orgId: string): Promise<AgentRunResult> {
  const perf = await analyzeProductPerformance(orgId)
  const recs: AgentRecommendation[] = []

  if (perf.totalProducts === 0) {
    recs.push({
      type: 'no_products',
      title: 'No products in your store',
      description: 'Add your first product to start selling. Consider starting with your best-selling or most popular item.',
      confidence: 0.99,
      impactScore: 100,
    })
  } else if (perf.activeProducts < perf.totalProducts) {
    recs.push({
      type: 'inactive_products',
      title: `${perf.totalProducts - perf.activeProducts} products inactive`,
      description: 'Some products are not active. Activate them to make them visible to customers.',
      confidence: 0.90,
      impactScore: 65,
    })
  }

  if (perf.underperforming.length > 0) {
    recs.push({
      type: 'underperforming_products',
      title: `${perf.underperforming.length} products with no orders`,
      description: `Products with no sales: ${perf.underperforming.map(p => p.title).join(', ')}. Consider updating their descriptions, images, or pricing.`,
      confidence: 0.75,
      impactScore: 60,
    })
  }

  const decision = perf.topProduct
    ? `${perf.topProduct.title} is your best performer — ${perf.activeProducts} active products`
    : 'No product revenue data yet'

  return { agentName: 'MERCHANT', organizationId: orgId, decision, confidence: 0.80, recommendations: recs, insights: [] }
}

async function runASCEND(orgId: string): Promise<AgentRunResult> {
  const funnel = await analyzeActivationFunnel(orgId)
  const recs: AgentRecommendation[] = []

  if (funnel.completionPct < 100) {
    recs.push({
      type: 'activation_gap',
      title: `Store ${funnel.completionPct}% activated`,
      description: `Next step: ${funnel.nextStep}. Complete your setup to start selling and receiving payouts.`,
      confidence: 0.95,
      impactScore: 100 - funnel.completionPct,
    })
  }

  if (!funnel.hasStorefront) {
    recs.push({
      type: 'storefront_not_published',
      title: 'Publish your storefront',
      description: 'Your storefront is not yet visible to customers. Go to Store settings and publish it.',
      confidence: 0.99,
      impactScore: 95,
    })
  }

  const decision = funnel.completionPct === 100 ? 'Creator fully activated'
    : `Activation at ${funnel.completionPct}% — ${funnel.nextStep}`

  return { agentName: 'ASCEND', organizationId: orgId, decision, confidence: 0.92, recommendations: recs, insights: [] }
}

// ── Main Execution Entry Point ────────────────────────────────────────────────

const RUNNERS: Partial<Record<AgentName, (orgId: string) => Promise<AgentRunResult>>> = {
  NOVA: runNOVA,
  ATLAS: runATLAS,
  TREASURY: runTREASURY,
  PULSE: runPULSE,
  MERCHANT: runMERCHANT,
  ASCEND: runASCEND,
}

export async function executeAgent(agentName: AgentName, orgId: string, trigger: AgentTrigger): Promise<AgentRunResult> {
  const agent = AGENTS[agentName]
  if (!agent) throw new Error(`Unknown agent: ${agentName}`)

  const runner = RUNNERS[agentName]
  if (!runner) {
    // Stub for agents without full implementations yet
    return {
      agentName,
      organizationId: orgId,
      decision: `${agent.displayName} analysis complete`,
      confidence: 0.70,
      recommendations: [],
      insights: [],
    }
  }

  const result = await runner(orgId)

  // Persist recommendations and insights
  await Promise.all([
    persistRecommendations(orgId, agentName, result.recommendations),
    persistInsights(orgId, result.insights),
    writeAudit({
      agentName,
      organizationId: orgId,
      input: { trigger, agentType: agent.type },
      decision: result.decision,
      confidence: result.confidence,
      actionTaken: `Generated ${result.recommendations.length} recommendations, ${result.insights.length} insights`,
      result: { recommendationCount: result.recommendations.length, insightCount: result.insights.length },
    }),
  ])

  return result
}

// ── Run All Agents for Org ────────────────────────────────────────────────────

export async function runAgentOS(orgId: string): Promise<AgentRunResult[]> {
  const trigger: AgentTrigger = { type: 'on_demand', source: 'dashboard' }
  const agentNames = Object.keys(RUNNERS) as AgentName[]

  const results = await Promise.allSettled(
    agentNames.map(name => executeAgent(name, orgId, trigger))
  )

  return results
    .filter((r): r is PromiseFulfilledResult<AgentRunResult> => r.status === 'fulfilled')
    .map(r => r.value)
}

export { getOrgId }
