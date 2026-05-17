import type { AutomationJob, AutomationStatus } from "./types"

export class ExecutionTracer {
  trace(job: AutomationJob, status: AutomationStatus, details: Record<string, unknown> = {}) {
    console.info(JSON.stringify({
      event: "automation.execution",
      jobId: job.jobId,
      tenantId: job.tenantId,
      workflowKey: job.workflowKey,
      correlationId: job.correlationId,
      attempt: job.attempt,
      status,
      details,
      at: new Date().toISOString(),
    }))
  }
}
