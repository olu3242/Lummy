export interface ReplayRecord { jobId: string; tenantId: string; workflowId?: string; failedAt: string }
export class ReplayInspector { constructor(private readonly records: ReplayRecord[]) {}
 byId(jobId: string){ return this.records.find(r=>r.jobId===jobId) }
 byWorkflow(workflowId: string){ return this.records.filter(r=>r.workflowId===workflowId) }
 byTenant(tenantId: string){ return this.records.filter(r=>r.tenantId===tenantId) }
 batch(start: string, end: string){ const s=+new Date(start), e=+new Date(end); return this.records.filter(r=>{const t=+new Date(r.failedAt); return t>=s&&t<=e}) }
}
