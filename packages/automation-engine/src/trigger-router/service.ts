import type { JobEnvelope } from "@lummy/runtime-orchestrator"
import { RuleService } from "../rules/service"

export class TriggerRouter {
  constructor(private readonly rules: RuleService) {}
  route(job: JobEnvelope<{ trigger: string }>) { return this.rules.listByTrigger(job.payload.trigger) }
}
