<<<<<<< HEAD
import { AutomationExecutionService, AutomationRunner, ActionRegistry, RuleService, TriggerRouter } from "@lummy/automation-engine"
import type { JobEnvelope, JobResult, QueueService } from "@lummy/runtime-orchestrator"

export function createAutomationHandler(queue: QueueService) {
  const ruleService = new RuleService()
  const router = new TriggerRouter(ruleService)
  const actions = new ActionRegistry(queue)
  const runner = new AutomationRunner(router, actions)
  const execution = new AutomationExecutionService(runner)

  return async (job: JobEnvelope<{ trigger: string; payload: Record<string, unknown> }>): Promise<JobResult> => execution.execute(job)
=======
import type { JobEnvelope, JobResult, QueueAdapter } from "../../../../packages/runtime-orchestrator/src"
import { handleFailure, runAutomationJob, type AutomationRule } from "../../../../packages/automation-engine/src"

export async function handleAutomationExecute(
  queue: QueueAdapter,
  rules: AutomationRule[],
  job: JobEnvelope<{ trigger: string; payload: Record<string, unknown> }>
): Promise<JobResult> {
  try {
    return await runAutomationJob(queue, rules, job)
  } catch (err) {
    await handleFailure(queue, job, err instanceof Error ? err.message : "automation_failed")
    return { ok: false, retryable: true }
  }
>>>>>>> main
}
