export class RuntimeAuditService { record(action: string, actor: string, metadata: Record<string, unknown>) { return { action, actor, metadata, auditedAt: new Date().toISOString() } } }
