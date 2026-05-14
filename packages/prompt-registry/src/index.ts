export type PromptDefinition = { id: string; tenantId: string; key: string; description: string };
export type PromptVersion = { definitionId: string; version: number; template: string; approved: boolean };
export type PromptExecution = { id: string; versionId: string; status: 'success' | 'failed'; latencyMs: number };
export type PromptEvaluation = { id: string; executionId: string; score: number; notes?: string };
export type PromptRollback = { id: string; definitionId: string; fromVersion: number; toVersion: number; reason: string };
