export type ComplianceCheck = { id: string; tenantId: string; domain: 'audit'|'retention'|'data'|'consent'|'export'|'ai'|'financial'; passed: boolean; details?: string };
export const complianceRuntime = { evaluate: (check: ComplianceCheck): ComplianceCheck => check };
