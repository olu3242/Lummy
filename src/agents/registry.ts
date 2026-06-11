// Agent OS Registry — defines all agents and their characteristics

export type AgentName =
  | 'NOVA' | 'ATLAS' | 'TREASURY' | 'PULSE' | 'MERCHANT'
  | 'VELOCITY' | 'AURA' | 'SENTINEL' | 'ORBIT' | 'ASCEND'

export type AgentType =
  | 'creator_success' | 'payments' | 'payouts' | 'operations' | 'commerce'
  | 'marketing' | 'customer_experience' | 'security' | 'growth_intelligence' | 'acquisition'

export interface AgentDefinition {
  name: AgentName
  displayName: string
  type: AgentType
  description: string
  emoji: string
  color: string          // Tailwind color class prefix (e.g. "brand-purple")
  domain: string[]       // Which data domains it has read access to
  allowedActions: string[]
  forbiddenActions: string[]
}

export const AGENTS: Record<AgentName, AgentDefinition> = {
  NOVA: {
    name: 'NOVA', displayName: 'Nova', type: 'creator_success',
    description: 'Creator success, revenue growth, store performance',
    emoji: '⭐', color: 'brand-purple',
    domain: ['orders', 'payments', 'products', 'storefronts'],
    allowedActions: ['create_recommendation', 'create_discount', 'generate_content'],
    forbiddenActions: ['issue_refund', 'transfer_funds', 'approve_payout', 'delete_products'],
  },
  ATLAS: {
    name: 'ATLAS', displayName: 'Atlas', type: 'payments',
    description: 'Payment reliability, failure detection, webhook monitoring',
    emoji: '⚡', color: 'amber-500',
    domain: ['payments', 'webhook_events', 'orders'],
    allowedActions: ['create_recommendation', 'raise_incident'],
    forbiddenActions: ['issue_refund', 'modify_payment_records', 'transfer_funds'],
  },
  TREASURY: {
    name: 'TREASURY', displayName: 'Treasury', type: 'payouts',
    description: 'Payout management, balance tracking, withdrawal guidance',
    emoji: '💰', color: 'brand-green',
    domain: ['payouts', 'payments', 'payout_accounts'],
    allowedActions: ['create_recommendation'],
    forbiddenActions: ['approve_payout', 'transfer_funds', 'modify_payment_records'],
  },
  PULSE: {
    name: 'PULSE', displayName: 'Pulse', type: 'operations',
    description: 'Operational health, webhook reliability, system monitoring',
    emoji: '📡', color: 'cyan-500',
    domain: ['webhook_events', 'orders', 'payments'],
    allowedActions: ['create_recommendation', 'raise_incident'],
    forbiddenActions: ['deploy_infrastructure', 'modify_payment_records'],
  },
  MERCHANT: {
    name: 'MERCHANT', displayName: 'Merchant', type: 'commerce',
    description: 'Product performance, pricing intelligence, inventory',
    emoji: '🛍️', color: 'orange-500',
    domain: ['products', 'orders', 'storefronts'],
    allowedActions: ['create_recommendation', 'create_bundle', 'feature_product'],
    forbiddenActions: ['delete_products', 'delete_orders'],
  },
  VELOCITY: {
    name: 'VELOCITY', displayName: 'Velocity', type: 'marketing',
    description: 'Campaign performance, traffic analysis, conversion optimization',
    emoji: '🚀', color: 'blue-500',
    domain: ['campaigns', 'orders', 'customer_profiles'],
    allowedActions: ['create_recommendation', 'create_campaign', 'send_broadcast', 'generate_content'],
    forbiddenActions: ['launch_campaigns_automatically'],
  },
  AURA: {
    name: 'AURA', displayName: 'Aura', type: 'customer_experience',
    description: 'Customer lifetime value, retention, satisfaction',
    emoji: '💜', color: 'pink-500',
    domain: ['customer_profiles', 'orders'],
    allowedActions: ['create_recommendation', 'generate_content'],
    forbiddenActions: ['delete_customers'],
  },
  SENTINEL: {
    name: 'SENTINEL', displayName: 'Sentinel', type: 'security',
    description: 'Security monitoring, anomaly detection, tenant isolation',
    emoji: '🛡️', color: 'red-500',
    domain: ['agent_audit_logs', 'payments', 'orders'],
    allowedActions: ['create_recommendation', 'raise_incident'],
    forbiddenActions: ['modify_payment_records', 'delete_orders', 'deploy_infrastructure'],
  },
  ORBIT: {
    name: 'ORBIT', displayName: 'Orbit', type: 'growth_intelligence',
    description: 'Growth metrics, creator lifecycle, expansion opportunities',
    emoji: '🌍', color: 'indigo-500',
    domain: ['orders', 'products', 'customer_profiles', 'storefronts'],
    allowedActions: ['create_recommendation'],
    forbiddenActions: [],
  },
  ASCEND: {
    name: 'ASCEND', displayName: 'Ascend', type: 'acquisition',
    description: 'Acquisition, landing pages, signup funnel, activation',
    emoji: '📈', color: 'emerald-500',
    domain: ['storefronts', 'orders'],
    allowedActions: ['create_recommendation', 'draft_landing_copy', 'draft_cta', 'generate_content'],
    forbiddenActions: ['publish_automatically', 'launch_campaigns_automatically'],
  },
}

// Intent routing: maps question keywords to the best agent
export const INTENT_ROUTES: { keywords: string[]; agent: AgentName; reason: string }[] = [
  { keywords: ['revenue', 'sales', 'income', 'earning', 'money', 'making', 'selling', 'store', 'performance', 'growth'],
    agent: 'NOVA', reason: 'Revenue and creator success analysis' },
  { keywords: ['payment', 'failed', 'declined', 'stripe', 'paystack', 'webhook', 'charge', 'transaction'],
    agent: 'ATLAS', reason: 'Payment reliability analysis' },
  { keywords: ['payout', 'withdrawal', 'bank', 'transfer', 'withdraw', 'balance', 'account'],
    agent: 'TREASURY', reason: 'Payout and balance management' },
  { keywords: ['webhook', 'error', 'ops', 'operational', 'system', 'health', 'failure', 'broken'],
    agent: 'PULSE', reason: 'Operational health monitoring' },
  { keywords: ['product', 'price', 'inventory', 'stock', 'bundle', 'catalog', 'item'],
    agent: 'MERCHANT', reason: 'Product and commerce intelligence' },
  { keywords: ['campaign', 'marketing', 'traffic', 'audience', 'promotion', 'broadcast', 'reach'],
    agent: 'VELOCITY', reason: 'Marketing and campaign intelligence' },
  { keywords: ['customer', 'buyer', 'client', 'retention', 'repeat', 'returning', 'churn'],
    agent: 'AURA', reason: 'Customer experience intelligence' },
  { keywords: ['security', 'hacked', 'breach', 'suspicious', 'access', 'unauthorized'],
    agent: 'SENTINEL', reason: 'Security monitoring' },
  { keywords: ['traffic', 'signup', 'landing', 'visitor', 'acquisition', 'conversion', 'activate'],
    agent: 'ASCEND', reason: 'Acquisition and activation intelligence' },
]

export function detectIntent(question: string): AgentName {
  const q = question.toLowerCase()
  for (const route of INTENT_ROUTES) {
    if (route.keywords.some(k => q.includes(k))) return route.agent
  }
  return 'NOVA' // default to creator success agent
}
