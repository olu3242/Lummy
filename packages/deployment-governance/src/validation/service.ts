export class DeploymentValidationService { assertReady(checks: Record<string, boolean>) { for (const [k,v] of Object.entries(checks)) if (!v) throw new Error(`check failed: ${k}`) } }
