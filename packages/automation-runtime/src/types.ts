export type AutomationStatus = "queued" | "running" | "completed" | "retry_scheduled" | "cancelled" | "dead_lettered" | "failed"

export interface AutomationJob {
  jobId: string
  tenantId: string
  workflowKey: string
  payload: Record<string, unknown>
  idempotencyKey: string
  correlationId: string
  causationId?: string | null
  attempt: number
  maxAttempts: number
  runAt: string
  timeoutMs: number
  createdAt: string
}

export interface AutomationResult {
  ok: boolean
  status: AutomationStatus
  retryAt?: string
  error?: string
}

export interface AutomationHandler {
  workflowKey: string
  execute(job: AutomationJob, signal: AbortSignal): Promise<AutomationResult>
}

export interface AutomationQueue {
  enqueue(queueName: string, job: AutomationJob): Promise<void>
}

export interface AutomationStore {
  recordExecution(job: AutomationJob, status: AutomationStatus, details?: Record<string, unknown>): Promise<void>
  recordHeartbeat(workerId: string, job: AutomationJob): Promise<void>
  isCancelled(jobId: string): Promise<boolean>
}
