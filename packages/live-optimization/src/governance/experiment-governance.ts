export type ExperimentGuardrail = { requiresApproval: boolean; maxTrafficPercent: number; rollbackEnabled: boolean }
export const defaultExperimentGuardrail: ExperimentGuardrail = { requiresApproval: true, maxTrafficPercent: 30, rollbackEnabled: true }
