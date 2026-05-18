export class AIRuntimeGovernanceService { enforce(approved: boolean) { if (!approved) throw new Error("execution approval required") } }
