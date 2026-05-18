export type AiSafetyControls = {
  explainabilityRequired: boolean
  approvalWorkflowRequired: boolean
  replayable: boolean
  rollbackSafety: boolean
  tenantIsolationRequired: boolean
}

export const defaultAiSafetyControls: AiSafetyControls = {
  explainabilityRequired: true,
  approvalWorkflowRequired: true,
  replayable: true,
  rollbackSafety: true,
  tenantIsolationRequired: true
}
