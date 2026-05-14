export type PolicyType = 'allow' | 'deny' | 'conditional' | 'approval-required' | 'escalation-required' | 'audit-required';

export type PolicyContext = {
  tenantId: string;
  orgId: string;
  actorId: string;
  resource: string;
  action: string;
  metadata?: Record<string, unknown>;
};

export type Policy = {
  id: string;
  type: PolicyType;
  scope: 'org' | 'tenant' | 'ai' | 'workflow' | 'regional' | 'moderation' | 'payment' | 'compliance';
  condition?: (context: PolicyContext) => boolean;
};

export type PolicyDecision = {
  allowed: boolean;
  reason: string;
  requiresApproval?: boolean;
  requiresEscalation?: boolean;
  requiresAudit?: boolean;
};

export function evaluatePolicy(policy: Policy, context: PolicyContext): PolicyDecision {
  const conditionResult = policy.condition ? policy.condition(context) : true;
  if (!conditionResult) return { allowed: false, reason: 'policy condition failed' };
  if (policy.type === 'deny') return { allowed: false, reason: 'policy deny' };
  if (policy.type === 'approval-required') return { allowed: true, reason: 'approval required', requiresApproval: true };
  if (policy.type === 'escalation-required') return { allowed: true, reason: 'escalation required', requiresEscalation: true };
  if (policy.type === 'audit-required') return { allowed: true, reason: 'audit required', requiresAudit: true };
  return { allowed: true, reason: 'policy allow' };
}
