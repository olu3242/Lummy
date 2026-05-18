import { AutomationExecutionService, AutomationRunner, ActionRegistry, RuleService, TriggerRouter } from "@lummy/automation-engine"
import type { JobEnvelope, JobResult, QueueService } from "@lummy/runtime-orchestrator"

export function createAutomationHandler(queue: QueueService) {
  const ruleService = new RuleService()
  const router = new TriggerRouter(ruleService)
  const actions = new ActionRegistry(queue)
  const runner = new AutomationRunner(router, actions)
  const execution = new AutomationExecutionService(runner)

  return async (job: JobEnvelope<{ trigger: string; payload: Record<string, unknown> }>): Promise<JobResult> => execution.execute(job)
}
