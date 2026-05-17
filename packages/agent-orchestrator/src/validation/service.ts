import type { JobEnvelope } from "@lummy/runtime-orchestrator"

export class AgentValidationService {
  validate(job: JobEnvelope): void {
    if (!job.idempotencyKey || !job.correlationId || !job.tenant?.tenantId) {
      throw new Error("Invalid job envelope for agent execution")
    }
  }
}
