export type TenantId = string;
export type AgentId = string;
export type ExecutionId = string;

export type AiExecutionRequest = {
  tenantId: TenantId;
  agentId: AgentId;
  promptKey: string;
  input: Record<string, unknown>;
  toolIds?: string[];
};

export type AiExecutionResult = {
  executionId: ExecutionId;
  status: 'completed' | 'failed' | 'fallback';
  output?: unknown;
  error?: string;
  model: string;
  provider: string;
  costUsd: number;
  latencyMs: number;
};
