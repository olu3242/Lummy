import type { WorkflowRunState, WorkflowStepState } from "../runtime/state-machine"
export type WorkflowStepType = "task"|"approval"|"ai"|"webhook"
export interface WorkflowStep { id: string; type: WorkflowStepType; next: string[]; retryLimit?: number; condition?: string; compensationStepId?: string }
export interface WorkflowDefinition { workflowId: string; version: number; tenantId: string; steps: WorkflowStep[]; graph: Record<string,string[]> }
export interface WorkflowVersion { workflowId: string; version: number; checksum: string }
export interface WorkflowRun { runId: string; workflowId: string; workflowVersion: number; tenantId: string; state: WorkflowRunState; traceId: string; correlationId: string }
export interface WorkflowTransition { runId: string; fromState: WorkflowRunState|WorkflowStepState; toState: WorkflowRunState|WorkflowStepState; at: string }
export interface WorkflowSnapshot { runId: string; state: WorkflowRunState; stepResults: Record<string, unknown>; executionContext: Record<string, unknown>; at: string }
export interface WorkflowApproval { runId: string; stepId: string; approverId?: string; state: "pending"|"approved"|"rejected" }
export interface WorkflowCompensation { runId: string; failedStepId: string; compensationChain: string[] }
