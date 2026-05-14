import type { JobEnvelope } from "../../../runtime-orchestrator/src"

export class AgentValidationService {
  validate(job: JobEnvelope): void {
    if (!job.idempotencyKey || !job.correlationId || !job.tenant?.tenantId) {
      throw new Error("Invalid job envelope for agent execution")
    }
  }
}
