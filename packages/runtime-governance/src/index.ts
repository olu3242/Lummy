export type WorkflowExecutionState = 'queued' | 'running' | 'retrying' | 'failed' | 'succeeded' | 'cancelled' | 'timed_out';

export type ExecutionSnapshot = {
  workflowId: string;
  executionId: string;
  tenantId: string;
  state: WorkflowExecutionState;
  attempt: number;
  maxAttempts: number;
  nextRetryAt?: string;
  deadLettered?: boolean;
  traceId: string;
  correlationId: string;
  updatedAt: string;
};

export function computeBackoffMs(attempt: number, baseMs = 500, maxMs = 30_000) {
  return Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt - 1));
}

export function isTerminalState(state: WorkflowExecutionState) {
  return state === 'failed' || state === 'succeeded' || state === 'cancelled' || state === 'timed_out';
}
