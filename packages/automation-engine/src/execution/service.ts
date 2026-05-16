import type { JobEnvelope, JobResult } from "@lummy/runtime-orchestrator"
import { AutomationRunner } from "../runner/service"

export class AutomationExecutionService {
  constructor(private readonly runner: AutomationRunner) {}
  execute(job: JobEnvelope<{ trigger: string; payload: Record<string, unknown> }>): Promise<JobResult> { return this.runner.run(job) }
}
