<<<<<<< HEAD
import type { JobEnvelope, JobResult } from "@lummy/runtime-orchestrator"
=======
import type { JobEnvelope, JobResult } from "../../../runtime-orchestrator/src"
>>>>>>> main
import { AgentRegistry } from "../registry/service"
import { routeAgents } from "../routing/router"
import { AgentGovernanceService } from "../governance/service"
import { AgentValidationService } from "../validation/service"

export class AgentExecutionService {
  constructor(
    private readonly registry: AgentRegistry,
    private readonly governance: AgentGovernanceService,
    private readonly validation: AgentValidationService
  ) {}

  async execute(job: JobEnvelope): Promise<JobResult> {
    this.validation.validate(job)
    const types = routeAgents(job.payload?.eventName as never)

    for (const type of types) {
      const candidates = this.registry.byType(type)
      for (const candidate of candidates) {
        if (!this.governance.canExecute(candidate, `event:${job.queue}`)) continue
        // execution delegated to downstream agent runtime adapters in next phase
      }
    }

    return { ok: true }
  }
}
