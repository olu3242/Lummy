export class RecoveryService { remediationPlan(incidentId: string) { return { incidentId, steps: ["isolate", "rollback", "replay"], createdAt: new Date().toISOString() } } }
