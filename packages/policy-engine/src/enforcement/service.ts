export class PolicyEnforcementService { enforce(allowed: boolean, reason?: string | null) { if (!allowed) throw new Error(`policy denied:${reason || 'unknown'}`) } }
