// Creator Copilot — unified "Ask Lummy" interface
// Routes questions to appropriate agents, generates natural language responses

import Anthropic from '@anthropic-ai/sdk'
import { detectIntent, AGENTS, type AgentName } from './registry'
import { executeAgent, runAgentOS } from './runtime'
import {
  computeStoreHealthScore,
  computeCreatorSuccessScore,
  getRevenuePipeline,
  forecastRevenue,
  analyzeActivationFunnel,
} from './intelligence'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface CopilotResponse {
  answer: string
  agent: AgentName
  agentDisplayName: string
  confidence: number
  recommendations: { title: string; description: string; impactScore: number }[]
  storeHealth?: number
  successScore?: number
}

export interface ExecutiveBriefing {
  type: 'daily' | 'weekly' | 'monthly'
  generatedAt: string
  storeHealth: number
  successScore: number
  sections: {
    title: string
    summary: string
    trend: 'up' | 'down' | 'stable'
    value: string
  }[]
  topRecommendation: string
  forecast: { low: number; mid: number; high: number }
}

export async function askCopilot(question: string, orgId: string): Promise<CopilotResponse> {
  const agentName = detectIntent(question)
  const agent = AGENTS[agentName]

  // Run the primary agent
  const result = await executeAgent(agentName, orgId, { type: 'on_demand', source: 'copilot' })

  // Build context for Claude
  const contextSummary = [
    `Agent: ${agent.displayName} (${agent.description})`,
    `Analysis: ${result.decision}`,
    `Confidence: ${Math.round(result.confidence * 100)}%`,
    result.recommendations.length > 0
      ? `Top recommendations:\n${result.recommendations.slice(0, 3).map(r => `- ${r.title}: ${r.description}`).join('\n')}`
      : 'No critical recommendations at this time.',
    result.insights.length > 0
      ? `Active insights:\n${result.insights.map(i => `- [${i.severity.toUpperCase()}] ${i.summary}`).join('\n')}`
      : '',
  ].filter(Boolean).join('\n\n')

  const systemPrompt = `You are Lummy, a helpful AI assistant for African creators and social sellers.
You help creators grow their businesses, manage payments, and optimize their stores.
Be conversational, encouraging, and practical. Keep responses concise (2-4 sentences).
Always give actionable advice. Use Nigerian/African business context where relevant.`

  const userPrompt = `Creator question: "${question}"

Data from ${agent.displayName} agent:
${contextSummary}

Provide a helpful, concise answer based on this data. If things are going well, celebrate it. If there are issues, be direct but encouraging.`

  let answer = result.decision
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    answer = (message.content[0] as { text: string }).text
  } catch { /* fallback to deterministic decision */ }

  return {
    answer,
    agent: agentName,
    agentDisplayName: agent.displayName,
    confidence: result.confidence,
    recommendations: result.recommendations.slice(0, 3).map(r => ({
      title: r.title,
      description: r.description,
      impactScore: r.impactScore,
    })),
    storeHealth: result.storeHealth,
    successScore: result.successScore,
  }
}

export async function generateBriefing(orgId: string, type: 'daily' | 'weekly' | 'monthly'): Promise<ExecutiveBriefing> {
  const [pipeline, health, success, funnel, forecast] = await Promise.all([
    getRevenuePipeline(orgId),
    computeStoreHealthScore(orgId),
    computeCreatorSuccessScore(orgId),
    analyzeActivationFunnel(orgId),
    forecastRevenue(orgId, type === 'daily' ? 1 : type === 'weekly' ? 7 : 30),
  ])

  const fmt = (n: number) => n.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })

  const sections = [
    {
      title: 'Revenue',
      summary: `${fmt(pipeline.revenueThisMonth)} this month (${pipeline.trend === 'improving' ? 'up' : pipeline.trend === 'declining' ? 'down' : 'stable'} vs. last month)`,
      trend: pipeline.trend === 'improving' ? 'up' as const : pipeline.trend === 'declining' ? 'down' as const : 'stable' as const,
      value: fmt(pipeline.revenueThisMonth),
    },
    {
      title: 'Orders',
      summary: `${pipeline.paidOrders} completed orders · ${pipeline.pendingOrders} pending · ${Math.round(pipeline.paymentSuccessRate * 100)}% payment success rate`,
      trend: 'stable' as const,
      value: String(pipeline.paidOrders),
    },
    {
      title: 'Store Health',
      summary: `Score ${health.score}/100 (Grade ${health.grade}) · ${health.components.filter(c => c.score < c.maxScore).map(c => c.label).join(', ') || 'All checks passing'}`,
      trend: health.score >= 70 ? 'up' as const : health.score >= 40 ? 'stable' as const : 'down' as const,
      value: `${health.score}/100`,
    },
    {
      title: 'Activation',
      summary: `${funnel.completionPct}% complete · Next: ${funnel.nextStep}`,
      trend: funnel.completionPct >= 80 ? 'up' as const : 'stable' as const,
      value: `${funnel.completionPct}%`,
    },
  ]

  const recs = await (async () => {
    try {
      const results = await runAgentOS(orgId)
      const allRecs = results.flatMap(r => r.recommendations)
      return allRecs.sort((a, b) => b.impactScore - a.impactScore)[0]?.title ?? 'Keep up the great work!'
    } catch { return 'Check your store health score and act on the recommendations.' }
  })()

  return {
    type,
    generatedAt: new Date().toISOString(),
    storeHealth: health.score,
    successScore: success.score,
    sections,
    topRecommendation: recs,
    forecast,
  }
}
