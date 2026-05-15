import type { JobEnvelope, JobResult } from "@lummy/runtime-orchestrator"
import { ActionRegistry } from "../actions/registry"
import { TriggerRouter } from "../trigger-router/service"

export class AutomationRunner {
  constructor(private readonly router: TriggerRouter, private readonly actions: ActionRegistry) {}
  async run(job: JobEnvelope<{ trigger: string; payload: Record<string, unknown> }>): Promise<JobResult> {
    const rules = this.router.route(job)
    for (const rule of rules) {
      await this.actions.enqueue(job, "analytics", { flow: rule.flow, source: job.payload.payload })
      await this.actions.enqueue(job, "messaging", { flow: rule.flow, source: job.payload.payload })
    }
    return { ok: true }
  }
}
