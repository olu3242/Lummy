export class AuditService { record(entity: string, action: string, metadata: Record<string, unknown>) { return { entity, action, metadata, auditedAt: new Date().toISOString() } } }
