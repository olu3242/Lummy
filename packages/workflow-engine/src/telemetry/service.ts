export class WorkflowTelemetryService { emit(metric: string, value: number, tenantId: string){ return { metric, value, tenantId, at: new Date().toISOString() } } }
